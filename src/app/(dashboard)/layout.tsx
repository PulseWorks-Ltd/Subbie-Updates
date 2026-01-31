
import { BottomNav } from "@/components/ui/nav";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen max-w-md mx-auto relative border-x border-slate-200 dark:border-white/5 bg-background-light dark:bg-background-dark">
            {children}
            <BottomNav />
        </div>
    );
}
