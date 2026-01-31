import { startCheckout, openCustomerPortal } from "@/app/actions/billing";

export default function BillingPage({
  searchParams,
}: {
  searchParams?: { error?: string; status?: string };
}) {
  const errorMessage = searchParams?.error;
  const status = searchParams?.status;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <main className="max-w-md mx-auto px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Manage your subscription and payment details.
        </p>

        {status === "success" && (
          <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 px-4 py-3 text-sm">
            Subscription updated successfully.
          </div>
        )}

        {status === "cancelled" && (
          <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-200 px-4 py-3 text-sm">
            Checkout cancelled.
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-red-400/40 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
            {errorMessage}
          </div>
        )}

        <form action={startCheckout}>
          <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg">
            Start subscription
          </button>
        </form>

        <form action={openCustomerPortal}>
          <button className="w-full border border-primary text-primary font-bold py-4 rounded-lg">
            Manage billing
          </button>
        </form>
      </main>
    </div>
  );
}
