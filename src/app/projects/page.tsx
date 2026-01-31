import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
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
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-white/10">
        <Link href="/dashboard" className="text-primary flex size-10 items-center justify-center">
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
            arrow_back_ios_new
          </span>
        </Link>
        <h1 className="text-lg font-bold">Projects</h1>
        <Link
          href="/projects/new"
          className="text-primary text-sm font-bold"
        >
          New
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/project/${project.id}/update`}
            className="block rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3"
          >
            <div className="font-bold">{project.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-300">
              {project.frequency}
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="text-sm text-slate-500 dark:text-slate-300">
            No projects yet.
          </div>
        )}
      </main>
    </div>
  );
}
