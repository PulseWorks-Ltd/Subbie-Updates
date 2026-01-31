import Link from "next/link";
import { createProject } from "@/app/actions/projects";

export default function NewProjectPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const errorMessage = searchParams?.error;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-white/10">
        <Link href="/dashboard" className="text-primary flex size-10 items-center justify-center">
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
            arrow_back_ios_new
          </span>
        </Link>
        <h1 className="text-lg font-bold">New Project</h1>
        <div className="size-10"></div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-2">Create Project</h2>
        <p className="text-slate-500 dark:text-slate-300 mb-6">
          Add a project and your primary client.
        </p>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-400/40 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
            {errorMessage}
          </div>
        )}

        <form action={createProject} className="space-y-4">
          <div>
            <label className="text-sm font-semibold uppercase tracking-wider">Project Name</label>
            <input
              name="name"
              className="mt-2 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3"
              placeholder="Kitchen Renovation"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold uppercase tracking-wider">Update Frequency</label>
            <select
              name="frequency"
              className="mt-2 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3"
              defaultValue="WEEKLY"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="FORTNIGHTLY">Fortnightly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold uppercase tracking-wider">Client Name</label>
            <input
              name="clientName"
              className="mt-2 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3"
              placeholder="Jane Client"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold uppercase tracking-wider">Client Email</label>
            <input
              name="clientEmail"
              type="email"
              className="mt-2 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3"
              placeholder="client@email.com"
              required
            />
          </div>

          <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg">
            Create Project
          </button>
        </form>
      </main>
    </div>
  );
}
