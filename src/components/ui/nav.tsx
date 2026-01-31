
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-6 py-3 pb-8 flex justify-between items-center z-50">
            <Link className={`flex flex-col items-center gap-1 ${isActive('/dashboard') ? 'text-primary' : 'text-slate-400'}`} href="/dashboard">
                <span className="material-symbols-outlined font-bold">dashboard</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Dashboard</span>
            </Link>
            <Link className={`flex flex-col items-center gap-1 ${isActive('/projects') ? 'text-primary' : 'text-slate-400'}`} href="#">
                <span className="material-symbols-outlined">folder</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Projects</span>
            </Link>
            <div className="-mt-12 flex flex-col items-center">
                <button className="bg-primary size-14 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-white border-4 border-background-light dark:border-background-dark active:scale-90 transition-transform cursor-pointer">
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>
            <Link className={`flex flex-col items-center gap-1 ${isActive('/clients') ? 'text-primary' : 'text-slate-400'}`} href="#">
                <span className="material-symbols-outlined">group</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Clients</span>
            </Link>
            <Link className={`flex flex-col items-center gap-1 ${isActive('/settings') ? 'text-primary' : 'text-slate-400'}`} href="#">
                <span className="material-symbols-outlined">settings</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Settings</span>
            </Link>
        </nav>
    );
}
