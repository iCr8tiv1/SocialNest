import { NextResponse } from "next/server";
import { serverDataConfigured, stripeConfigured, supabaseConfigured } from "@/lib/config";
import { publicDb } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = publicDb();
  if (!db) {
    return NextResponse.json(
      {
        status: "degraded",
        services: {
          database: "not_configured",
          authentication: "not_configured",
          admin: "not_configured",
          payments: stripeConfigured ? "configured" : "not_configured",
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const [events, spaces, profiles] = await Promise.all([
    db.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
    db.from("spaces").select("id", { count: "exact", head: true }).eq("active", true),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("directory_visible", true),
  ]);
  const databaseConnected = !events.error && !spaces.error && !profiles.error;
  const fullyConfigured = databaseConnected && serverDataConfigured;

  return NextResponse.json(
    {
      status: fullyConfigured ? "ready" : databaseConnected ? "operational" : "degraded",
      services: {
        database: databaseConnected ? "connected" : "error",
        authentication: supabaseConfigured ? "connected" : "not_configured",
        admin: serverDataConfigured ? "configured" : "requires_service_role",
        payments: stripeConfigured ? "configured" : "not_configured",
      },
      publicData: databaseConnected
        ? {
            publishedEvents: events.count ?? 0,
            activeSpaces: spaces.count ?? 0,
            directoryMembers: profiles.count ?? 0,
          }
        : undefined,
    },
    {
      status: databaseConnected ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
