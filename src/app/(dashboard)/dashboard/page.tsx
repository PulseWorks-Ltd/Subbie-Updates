
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ProjectCard } from "@/components/feature/ProjectCard";
import { redirect } from "next/navigation";
import Link from "next/link";
import { computeProjectStatus } from "@/lib/helpers/projectStatus";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/api/auth/signin");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            orgs: {
                include: { org: true }
            }
        }
    });

    if (!user || user.orgs.length === 0) {
        return <div className="p-4">No Organization Found. Please contact support.</div>;
    }

    const activeOrg = user.orgs[0].org;

    const projects = await prisma.project.findMany({
        where: { orgId: activeOrg.id, status: "ACTIVE" },
        include: {
            recipients: true,
            updates: {
                orderBy: { createdAt: "desc" },
                take: 1
            }
        },
        orderBy: { createdAt: "desc" }
    });

    const overdueProjects = projects.filter((p: typeof projects[0]) => {
        // @ts-ignore
        return computeProjectStatus(p.updates[0]?.createdAt || null, p.frequency) === "Overdue";
    });

    const otherProjects = projects.filter((p: typeof projects[0]) => {
        // @ts-ignore
        return computeProjectStatus(p.updates[0]?.createdAt || null, p.frequency) !== "Overdue";
    });

    return (
        <main className="flex-1 pb-24">
            {/* Top App Bar */}
            <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5">
                <div className="flex items-center px-4 py-4 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 overflow-hidden rounded-full border-2 border-primary bg-slate-200">
                            {/* Placeholder Avatar */}
                            {user.image ? (
                                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xs">{user.name?.slice(0, 2).toUpperCase() || "ME"}</div>
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Main Dashboard</p>
                            <h2 className="text-lg font-bold leading-tight">{activeOrg.name}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex size-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Greeting & Stats */}
            <section className="px-4 pt-6 pb-2">
                <h1 className="text-3xl font-bold tracking-tight">G'day, {user.name?.split(' ')[0] || 'Mate'}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">You have {overdueProjects.length} updates due.</p>
            </section>

            {/* Priority List: Updates Due Today/Overdue */}
            {overdueProjects.length > 0 && (
                <section className="mt-6">
                    <div className="flex items-center justify-between px-4 mb-3">
                        <h3 className="text-primary text-sm font-bold uppercase tracking-widest">Updates Due</h3>
                        <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/30">URGENT</span>
                    </div>
                    <div className="space-y-3 px-4">
                        {overdueProjects.map((project: typeof projects[0]) => (
                            // @ts-ignore
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                </section>
            )}

            {/* Active Projects Section */}
            <section className="mt-8">
                <div className="px-4 mb-4 flex justify-between items-end">
                    <h2 className="text-xl font-bold">Active Projects</h2>
                    <Link className="text-primary text-sm font-bold" href="#">View All</Link>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-white/5 bg-white dark:bg-white/5 mx-4 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                    {otherProjects.map((project: typeof projects[0]) => (
                        <Link key={project.id} href={`/project/${project.id}/update`} className="flex items-center gap-4 px-4 py-4 justify-between hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="text-primary bg-primary/10 rounded-lg shrink-0 size-12 flex items-center justify-center">
                                    <span className="material-symbols-outlined">construction</span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-base font-bold leading-normal">{project.name}</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-normal">
                                        Last updated: {project.updates[0] ? formatDistanceToNow(new Date(project.updates[0].createdAt), { addSuffix: true }) : "Never"}
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-3">
                                {/* Status Dot */}
                                <div className="size-2 rounded-full bg-emerald-500"></div>
                                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                            </div>
                        </Link>
                    ))}
                    {otherProjects.length === 0 && overdueProjects.length === 0 && (
                        <div className="p-4 text-center text-slate-500 text-sm">No active projects found.</div>
                    )}
                </div>
            </section>
        </main>
    );
}
