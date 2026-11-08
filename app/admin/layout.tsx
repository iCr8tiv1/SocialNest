import { NestMark } from "@/components/site-chrome";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/auth";
import { serverDataConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | Social Nest", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <div className="admin-shell">
    <header className="admin-header">
      <a className="brand" href="/admin"><NestMark /><span>SOCIAL NEST<small>Admin</small></span></a>
      <AdminNav />
      <div className="admin-user"><span>{admin.email}</span><a href="/" className="text-link">View site</a></div>
    </header>
    <main className="admin-main">{serverDataConfigured ? children : <p className="notice">Connect Supabase to use the dashboard.</p>}</main>
  </div>;
}
