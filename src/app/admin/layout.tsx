import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import AdminShell from "./AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    if (auth.status === 401) redirect("/auth/login?redirect=/admin");
    return (
      <main className="min-h-screen bg-[#08090C] p-8 text-center text-white">
        <h1 className="text-xl font-semibold">Administrator access required</h1>
        <Link className="mt-4 inline-block text-sm text-purple-300 underline" href="/">Return to storefront</Link>
      </main>
    );
  }
  return <AdminShell>{children}</AdminShell>;
}
