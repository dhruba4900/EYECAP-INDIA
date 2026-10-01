import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import DeliveryShell from "./DeliveryShell";

export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuth(["DELIVERY_PARTNER"]);
  if ("error" in auth) {
    if (auth.status === 401) redirect("/auth/login?redirect=/delivery");
    return (
      <main className="min-h-screen bg-[#07090D] p-8 text-center text-white">
        <h1 className="text-xl font-semibold">Delivery partner access required</h1>
        <Link className="mt-4 inline-block text-sm text-emerald-300 underline" href="/">Return to storefront</Link>
      </main>
    );
  }
  return <DeliveryShell>{children}</DeliveryShell>;
}
