import { startCheckout } from "@/app/actions/billing";

const plans = [
  {
    id: "solo",
    name: "Solo",
    description: "Best for individual tradies",
    priceEnv: "STRIPE_PRICE_ID_SOLO",
  },
  {
    id: "agency",
    name: "Agency",
    description: "For teams and growing crews",
    priceEnv: "STRIPE_PRICE_ID_AGENCY",
  },
];

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <main className="max-w-md mx-auto px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold">Choose a plan</h1>
        <div className="space-y-4">
          {plans.map((plan) => (
            <form
              key={plan.id}
              action={startCheckout.bind(
                null,
                process.env[plan.priceEnv] || process.env.STRIPE_PRICE_ID
              )}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 space-y-3"
            >
              <div>
                <h2 className="text-lg font-bold">{plan.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  {plan.description}
                </p>
              </div>
              <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg">
                Select {plan.name}
              </button>
            </form>
          ))}
        </div>
      </main>
    </div>
  );
}
