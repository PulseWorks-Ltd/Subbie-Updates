import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { computeProjectStatus } from "@/lib/helpers/projectStatus";
import { formatDistanceToNow } from "date-fns";

export default async function NotificationsPage() {
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

  const projects = await prisma.project.findMany({
    where: { orgId },
    include: {
      updates: { orderBy: { createdAt: "desc" }, take: 1 },
      recipients: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const overdue = projects.filter((p: typeof projects[0]) =>
    computeProjectStatus(p.updates[0]?.createdAt || null, p.frequency) === "Overdue"
  );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-white/10">
        <Link href="/dashboard" className="text-primary flex size-10 items-center justify-center">
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
            arrow_back_ios_new
          </span>
        </Link>
        <h1 className="text-lg font-bold">Notifications</h1>
        <div className="size-10" />
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-3">
        {overdue.length === 0 && (
          <div className="text-sm text-slate-500 dark:text-slate-300">
            No urgent updates right now.
          </div>
        )}
        {overdue.map((project) => (
          <Link
            key={project.id}
            href={`/project/${project.id}/update`}
            className="block rounded-xl border border-primary/20 bg-primary/10 px-4 py-4"
          >
            <div className="text-xs uppercase tracking-widest text-primary font-bold">Overdue</div>
            <div className="font-bold mt-1">{project.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-300 mt-1">
              Last update:{" "}
              {project.updates[0]
                ? formatDistanceToNow(new Date(project.updates[0].createdAt), { addSuffix: true })
                : "Never"}
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
