import Link from "next/link";
import { loginWithCredentials } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; created?: string };
}) {
  const errorMessage = searchParams?.error;
  const created = searchParams?.created === "1";

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-center p-0 m-0">
      <div className="relative flex min-h-screen w-full max-w-[480px] flex-col bg-background-light dark:bg-background-dark overflow-x-hidden shadow-2xl">
        <div className="@container w-full">
          <div className="px-4 py-8 flex flex-col items-center">
            <div
              className="w-full h-48 bg-center bg-no-repeat bg-contain flex flex-col justify-center items-center rounded-xl"
              style={{
                backgroundImage:
                  "url(https://lh3.googleusercontent.com/aida-public/AB6AXuBqF68PSYRr3HtXaKjgPizl4xQG470-KBV7PZBwpIhYR8DEYZBumuk5L6pSFgOUPK-1-3STcOlcSGFUmzsFf5DM-qDe3ZtiOKFO-A8-8hxodpmNxVAUba8ONJHwR4hv5Db1yb7r7LJRCHf8k3LRn0H-wlW5aTfKSO9oIl8DHoisfdf6Rs0I5U4ZPKGYCmAIWUFzpyZ99xWeWMGooQGhfEG8WvJDh_RZgiNI7tM1nqIUVpomw-hPTM2Tw9vNaCa5GPxa14R9QXmE7wt3)",
              }}
            />
          </div>
        </div>

        <div className="w-full">
          <h1 className="text-gray-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight px-6 text-center pb-2 pt-4 font-display">
            Subbie Updates
          </h1>
          <p className="text-gray-600 dark:text-[#cba490] text-center text-sm px-6 pb-6">
            Gear up. Get updated. Get to work.
          </p>
        </div>

        <div className="flex flex-col w-full px-6 space-y-2">
          {created && (
            <div className="rounded-lg border border-primary/40 bg-primary/10 text-primary px-4 py-3 text-sm">
              Account created. Please sign in.
            </div>
          )}
          {errorMessage && (
            <div className="rounded-lg border border-red-400/40 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
              {errorMessage}
            </div>
          )}

          <form action={loginWithCredentials} className="space-y-4">
            <div className="flex flex-col w-full py-2">
              <label className="flex flex-col w-full">
                <p className="text-gray-700 dark:text-white text-base font-semibold leading-normal pb-2 uppercase tracking-wider text-xs">
                  Email Address
                </p>
                <input
                  name="email"
                  className="form-input flex w-full rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-[#684331] bg-white dark:bg-[#342218] h-14 placeholder:text-gray-400 dark:placeholder:text-[#cba490] px-4 text-base font-normal"
                  placeholder="name@tradie.com"
                  type="email"
                  required
                />
              </label>
            </div>

            <div className="flex flex-col w-full py-2">
              <label className="flex flex-col w-full">
                <p className="text-gray-700 dark:text-white text-base font-semibold leading-normal pb-2 uppercase tracking-wider text-xs">
                  Password
                </p>
                <div className="relative flex w-full items-stretch">
                  <input
                    name="password"
                    className="form-input flex w-full rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-[#684331] bg-white dark:bg-[#342218] h-14 placeholder:text-gray-400 dark:placeholder:text-[#cba490] px-4 text-base font-normal"
                    placeholder="Enter your password"
                    type="password"
                    required
                  />
                  <button
                    aria-label="Toggle password visibility"
                    className="absolute right-0 top-0 h-full px-4 text-gray-500 dark:text-[#cba490] flex items-center justify-center"
                    type="button"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </div>
              </label>
            </div>

            <div className="flex justify-end">
              <Link
                className="text-primary text-sm font-semibold leading-normal py-1 underline decoration-primary/30 hover:decoration-primary transition-all"
                href="/signup"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="pt-6 pb-4">
              <button className="w-full bg-primary hover:bg-[#d64e0b] active:scale-[0.98] text-white text-lg font-bold py-4 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2">
                Sign in with Credentials
              </button>
            </div>
          </form>
        </div>

        <div className="flex-grow"></div>

        <div className="w-full p-8 text-center">
          <p className="text-gray-600 dark:text-[#cba490] text-base font-medium">
            Don&apos;t have an account?
            <Link className="text-primary font-bold hover:underline ml-1" href="/signup">
              Sign up
            </Link>
          </p>
        </div>

        <div className="h-8 bg-transparent"></div>
      </div>
    </div>
  );
}
