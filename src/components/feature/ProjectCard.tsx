
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Project, Recipient, Update } from "@prisma/client";
import { computeProjectStatus } from "@/lib/helpers/projectStatus";

interface ProjectWithDetails extends Project {
    recipients: Recipient[];
    updates: Update[];
}

export function ProjectCard({ project }: { project: ProjectWithDetails }) {
    const lastUpdate = project.updates[0]?.createdAt || null;
    // @ts-ignore - Enum mismatch possible until types generated
    const status = computeProjectStatus(lastUpdate, project.frequency);
    const clientName = project.recipients[0]?.name || "No Client";

    return (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-3xl">construction</span>
                    </div>
                    <div>
                        <p className="font-bold text-lg leading-tight">{project.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Client: {clientName}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    {status === "Overdue" && (
                        <>
                            <span className="size-3 rounded-full bg-red-500 animate-pulse"></span>
                            <p className="text-[10px] mt-1 text-red-500 font-bold uppercase">Overdue</p>
                        </>
                    )}
                    {status === "Due Soon" && (
                        <>
                            <span className="size-3 rounded-full bg-amber-500"></span>
                            <p className="text-[10px] mt-1 text-amber-500 font-bold uppercase">Due Soon</p>
                        </>
                    )}
                    {status === "On Track" && (
                        <>
                            <span className="size-3 rounded-full bg-emerald-500"></span>
                            <p className="text-[10px] mt-1 text-emerald-500 font-bold uppercase">On Track</p>
                        </>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>Last updated: {lastUpdate ? formatDistanceToNow(new Date(lastUpdate), { addSuffix: true }) : "Never"}</span>
            </div>
            <Link href={`/project/${project.id}/update`} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform">
                <span className="material-symbols-outlined">add_a_photo</span>
                NEW UPDATE
            </Link>
        </div>
    );
}
