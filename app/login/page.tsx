import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { LoginForm } from "@/components/login-form";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in | Social Nest" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/account", error } = await searchParams;
  if (await getSessionUser()) redirect(next.startsWith("/") ? next : "/account");
  return <main>
    <SiteHeader />
    <section className="auth-section">
      <div>
        <p className="eyebrow">Members</p>
        <h1>Sign in to Social Nest.</h1>
        <p className="detail-lede">Manage your tickets and bookings, join the business directory, and send referrals to other members. No password needed — we’ll email you a secure link.</p>
      </div>
      <div className="detail-panel">
        {error && <p className="notice">That sign-in link expired or was already used. Request a new one below.</p>}
        <LoginForm next={next} />
      </div>
    </section>
    <SiteFooter />
  </main>;
}
