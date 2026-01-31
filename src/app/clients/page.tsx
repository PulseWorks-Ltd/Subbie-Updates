import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { orgs: { include: { org: true } } },
  });

  if (!user || user.orgs.length === 0) {
    return <div className="p-6">No organization found.</div>;
  }

  const orgId = user.orgs[0].org.id;

  const recipients = await prisma.recipient.findMany({
    where: { project: { orgId } },
    include: { project: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-white/10">
        <Link href="/dashboard" className="text-primary flex size-10 items-center justify-center">
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
            arrow_back_ios_new
          </span>
        </Link>
        <h1 className="text-lg font-bold">Clients</h1>
        <div className="size-10" />
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-3">
        {recipients.map((recipient) => (
          <div
            key={recipient.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3"
          >
            <div>
              <div className="font-semibold">{recipient.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-300">{recipient.email}</div>
              <div className="text-xs text-slate-500 dark:text-slate-300">Project: {recipient.project.name}</div>
            </div>
            <Link
              href={`/project/${recipient.projectId}/settings`}
              className="text-primary text-sm font-semibold"
            >
              Manage
            </Link>
          </div>
        ))}
        {recipients.length === 0 && (
          <div className="text-sm text-slate-500 dark:text-slate-300">
            No clients yet.
          </div>
        )}
      </main>
    </div>
  );
}
