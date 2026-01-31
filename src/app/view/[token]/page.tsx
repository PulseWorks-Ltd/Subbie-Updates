
import prisma from "@/lib/prisma";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

export default async function PublicUpdateView({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    const update = await prisma.update.findUnique({
        where: { publicToken: token },
        include: {
            project: { include: { org: true } },
            author: true,
            assets: true
        }
    });

    if (!update) return <div className="p-8 text-center">Update not found or link expired.</div>;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white max-w-md mx-auto relative flex flex-col">
            {/* Simple Header */}
            <header className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">construction</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">{update.project.name}</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{update.project.org.name}</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 pb-12">
                {/* Timestamp & Author */}
                <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
                    <div className="size-6 rounded-full bg-slate-200 overflow-hidden">
                        {update.author.image && <img src={update.author.image} className="w-full h-full object-cover" />}
                    </div>
                    <p>
                        <span className="font-bold text-slate-900 dark:text-white">{update.author.name || "Team Member"}</span> posted {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                    </p>
                </div>

                {/* Summary */}
                <div className="prose dark:prose-invert mb-6 p-4 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                    <p className="whitespace-pre-wrap">{update.summary}</p>
                </div>

                {/* Assets Grid */}
                {update.assets.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                        {update.assets.map((asset: typeof update.assets[0]) => (
                            // In real app, generate presigned GET url or use public bucket URL if configured
                            // Assuming public-read or using CloudFront for 'uploads/'
                            <div key={asset.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-white/5">
                                {/* For now assuming direct S3 URL or proxy */}
                                <Image
                                    src={`https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${asset.s3Key}`}
                                    alt="Site Photo"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <footer className="p-4 text-center text-xs text-slate-400">
                Powered by Stitch
            </footer>
        </div>
    );
}
