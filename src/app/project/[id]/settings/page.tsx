import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { addRecipient, removeRecipient } from "@/app/actions/projects";

export default async function ProjectSettingsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string };
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      recipients: true,
      org: { include: { users: true } },
    },
  });

  if (!project) {
    return <div className="p-6">Project not found.</div>;
  }

  const hasAccess = project.org.users.some((u) => u.userId === session.user?.id);
  if (!hasAccess) {
    return <div className="p-6">Unauthorized.</div>;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-white/10">
        <Link href="/dashboard" className="text-primary flex size-10 items-center justify-center">
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
            arrow_back_ios_new
          </span>
        </Link>
        <h1 className="text-lg font-bold">Project Settings</h1>
        <div className="size-10"></div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold">{project.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Manage recipients</p>
        </div>

        {searchParams?.error && (
          <div className="rounded-lg border border-red-400/40 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
            {searchParams.error}
          </div>
        )}

        <form action={addRecipient.bind(null, project.id)} className="space-y-3">
          <div>
            <label className="text-sm font-semibold uppercase tracking-wider">Recipient Name</label>
            <input
              name="name"
              className="mt-2 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3"
              placeholder="Client Name"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold uppercase tracking-wider">Recipient Email</label>
            <input
              name="email"
              type="email"
              className="mt-2 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3"
              placeholder="client@email.com"
              required
            />
          </div>
          <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg">
            Add Recipient
          </button>
        </form>

        <div className="space-y-3">
          {project.recipients.map((recipient) => (
            <div
              key={recipient.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3"
            >
              <div>
                <div className="font-semibold">{recipient.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-300">{recipient.email}</div>
              </div>
              <form action={removeRecipient.bind(null, project.id, recipient.id)}>
                <button className="text-red-500 text-sm font-semibold">Remove</button>
              </form>
            </div>
          ))}
          {project.recipients.length === 0 && (
            <div className="text-sm text-slate-500 dark:text-slate-300">No recipients yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}
