import Link from "next/link";
import { createAccount } from "./actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const errorMessage = searchParams?.error;

  return (
    <div className="bg-background-light dark:bg-background-dark text-white min-h-screen flex flex-col">
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b border-white/5">
        <Link href="/" className="text-primary flex size-12 shrink-0 items-center cursor-pointer">
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
            chevron_left
          </span>
        </Link>
        <div className="flex-1 flex justify-center pr-12">
          <span className="font-bold tracking-widest text-sm text-primary uppercase">Subbie Updates</span>
        </div>
      </div>

      <div className="flex-1 max-w-[480px] mx-auto w-full px-4 pt-8">
        <div className="mb-8">
          <h1 className="text-white tracking-tight text-[40px] font-bold leading-none mb-2">Create Your Account</h1>
          <p className="text-white/60 text-lg font-medium">Join the digital site crew today.</p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-400/40 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
            {errorMessage}
          </div>
        )}

        <form action={createAccount} className="space-y-4">
          <div className="flex flex-col w-full">
            <p className="text-white text-sm font-bold uppercase tracking-wider pb-2 opacity-80">Full Name</p>
            <div className="relative">
              <input
                name="name"
                className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-white/20 bg-white/5 focus:border-primary h-14 placeholder:text-white/30 p-[15px] text-base font-normal leading-normal transition-all"
                placeholder="John Smith"
                type="text"
                required
              />
            </div>
          </div>

          <div className="flex flex-col w-full">
            <p className="text-white text-sm font-bold uppercase tracking-wider pb-2 opacity-80">Organization Name</p>
            <div className="relative">
              <input
                name="orgName"
                className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-white/20 bg-white/5 focus:border-primary h-14 placeholder:text-white/30 p-[15px] text-base font-normal leading-normal transition-all"
                placeholder="e.g. Smith & Sons Plumbing"
                type="text"
                required
              />
            </div>
          </div>

          <div className="flex flex-col w-full">
            <p className="text-white text-sm font-bold uppercase tracking-wider pb-2 opacity-80">Email Address</p>
            <div className="relative">
              <input
                name="email"
                className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-white/20 bg-white/5 focus:border-primary h-14 placeholder:text-white/30 p-[15px] text-base font-normal leading-normal transition-all"
                placeholder="name@company.com"
                type="email"
                required
              />
            </div>
          </div>

          <div className="flex flex-col w-full">
            <p className="text-white text-sm font-bold uppercase tracking-wider pb-2 opacity-80">Create Password</p>
            <div className="relative">
              <input
                name="password"
                className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-white/20 bg-white/5 focus:border-primary h-14 placeholder:text-white/30 p-[15px] text-base font-normal leading-normal transition-all"
                placeholder="••••••••"
                type="password"
                required
                minLength={6}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 cursor-pointer">
                <span className="material-symbols-outlined">visibility</span>
              </div>
            </div>
          </div>

          <div className="mt-10 mb-8">
            <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-lg text-lg uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              Start 14-Day Free Trial
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <p className="text-white/40 text-sm text-center mt-4 flex items-center justify-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-base">verified_user</span>
              No credit card required
            </p>
          </div>
        </form>

        <div className="mt-auto pb-8 border-t border-white/5 pt-6 text-center">
          <p className="text-white/60 font-medium">
            Already have an account?
            <Link className="text-primary font-bold ml-1 hover:underline" href="/login">
              Login
            </Link>
          </p>
        </div>
      </div>

      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}
