import Link from "next/link";

export default function UpdateSentPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  const token = searchParams?.token;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">check_circle</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Update sent</h1>
        <p className="text-slate-500 dark:text-slate-300 mb-6">
          Your update has been created. Share the public link with your client.
        </p>

        {token ? (
          <Link
            className="w-full inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg"
            href={`/view/${token}`}
          >
            View public update
          </Link>
        ) : (
          <Link
            className="w-full inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
        )}

        <div className="mt-4">
          <Link className="text-primary text-sm font-semibold" href="/dashboard">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
