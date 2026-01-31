import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { orgs: { include: { org: true } } },
  });

  if (!user || user.orgs.length === 0) {
    return <div className="p-6">No organization found.</div>;
  }

  const org = user.orgs[0].org;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-white/10">
        <Link href="/dashboard" className="text-primary flex size-10 items-center justify-center">
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
            arrow_back_ios_new
          </span>
        </Link>
        <h1 className="text-lg font-bold">Settings</h1>
        <div className="size-10" />
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-4">
          <div className="text-xs uppercase tracking-widest text-slate-400">Organization</div>
          <div className="font-bold mt-2">{org.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-300 mt-1">Plan: {org.plan}</div>
        </div>

        <Link
          href="/billing"
          className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-4"
        >
          <div>
            <div className="font-semibold">Billing</div>
            <div className="text-xs text-slate-500 dark:text-slate-300">Manage subscription</div>
          </div>
          <span className="material-symbols-outlined text-slate-400">chevron_right</span>
        </Link>

        <Link
          href="/projects"
          className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-4"
        >
          <div>
            <div className="font-semibold">Projects</div>
            <div className="text-xs text-slate-500 dark:text-slate-300">View all projects</div>
          </div>
          <span className="material-symbols-outlined text-slate-400">chevron_right</span>
        </Link>

        <Link
          href="/stitch/subscription-plans-selection"
          className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-4"
        >
          <div>
            <div className="font-semibold">Plans</div>
            <div className="text-xs text-slate-500 dark:text-slate-300">View available plans</div>
          </div>
          <span className="material-symbols-outlined text-slate-400">chevron_right</span>
        </Link>
      </main>
    </div>
  );
}
