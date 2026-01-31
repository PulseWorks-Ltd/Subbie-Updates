
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { getPresignedUrl } from "@/app/actions/media";
import { submitUpdateAction } from "@/app/actions/updates";
import { generateAiSummary } from "@/app/actions/ai";
import { useRouter } from "next/navigation";

interface UpdateComposerProps {
    projectId: string;
    projectName: string;
}

export function UpdateComposer({ projectId, projectName }: UpdateComposerProps) {
    const router = useRouter();
    const [summary, setSummary] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [uploads, setUploads] = useState<{ key: string; url: string; type: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        const file = e.target.files[0];
        const contentType = file.type;

        try {
            // 1. Get Presigned URL
            const { signedUrl, key } = await getPresignedUrl(file.name, contentType);

            // 2. Upload directly to S3
            await fetch(signedUrl, {
                method: "PUT",
                headers: { "Content-Type": contentType },
                body: file,
            });

            // 3. Update State (Optimistic usage of URL.createObjectURL or just trusting the uploads)
            // For immediate preview, we can use a local object URL
            const previewUrl = URL.createObjectURL(file);
            setUploads(prev => [...prev, { key, url: previewUrl, type: contentType }]);

        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload image. Please try again.");
        }
    };

    const handleSubmit = async () => {
        if (!summary) return;
        setIsSubmitting(true);
        try {
            const result = await submitUpdateAction(projectId, {
                summary,
                assets: uploads.map(u => ({ key: u.key, types: u.type }))
            });
            if (result?.publicToken) {
                router.push(`/updates/sent?token=${result.publicToken}`);
            } else {
                router.push("/dashboard");
            }
        } catch (error) {
            alert("Failed to create update.");
            setIsSubmitting(false);
        }
    };

    const handleGenerateSummary = async () => {
        if (!summary.trim()) return;
        setIsGenerating(true);
        try {
            const result = await generateAiSummary({ notes: summary, projectName });
            if (result?.summary) {
                setSummary(result.summary);
            }
        } catch (error) {
            alert("Failed to generate AI summary.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-background-light dark:bg-background-dark">
            {/* TopAppBar */}
            <header className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b border-gray-200 dark:border-white/10">
                <button onClick={() => router.back()} className="text-primary flex size-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>arrow_back_ios_new</span>
                </button>
                <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">{projectName}</h2>
                <button
                    onClick={() => router.push(`/project/${projectId}/settings`)}
                    className="text-slate-500 dark:text-slate-300 flex size-10 items-center justify-center rounded-full hover:bg-slate-200/40 dark:hover:bg-white/5 transition-colors"
                    aria-label="Project settings"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>settings</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-4 pb-32">
                <section className="pt-6 pb-4">
                    <h3 className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight">New Update</h3>
                    <p className="text-gray-500 dark:text-[#cba490] text-sm mt-1">Capture progress for the client</p>
                </section>

                {/* Action Buttons */}
                <section className="flex gap-3 py-4">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex flex-col gap-3 items-center justify-center aspect-square rounded-xl bg-white dark:bg-[#342218] border border-gray-200 dark:border-[#684331] text-gray-900 dark:text-white transition-active active:scale-95"
                    >
                        <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>add_a_photo</span>
                        </div>
                        <span className="font-bold text-sm">Upload Photos</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />

                    <button className="flex-1 flex flex-col gap-3 items-center justify-center aspect-square rounded-xl bg-white dark:bg-[#342218] border border-gray-200 dark:border-[#684331] text-gray-900 dark:text-white opacity-50 cursor-not-allowed">
                        <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>mic</span>
                        </div>
                        <span className="font-bold text-sm">Record Voice</span>
                    </button>
                </section>

                {/* Uploaded Images Preview */}
                {uploads.length > 0 && (
                    <section className="py-2 flex gap-2 overflow-x-auto">
                        {uploads.map((u, i) => (
                            <div key={i} className="relative size-20 rounded-lg overflow-hidden border border-gray-200">
                                <Image src={u.url} alt="Upload" fill className="object-cover" />
                            </div>
                        ))}
                    </section>
                )}

                {/* Quick Notes */}
                <section className="py-4">
                    <label className="flex flex-col w-full">
                        <p className="text-gray-700 dark:text-white text-base font-semibold leading-normal pb-2 px-1">Quick Notes</p>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className="flex w-full resize-none overflow-hidden rounded-xl text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-200 dark:border-[#684331] bg-white dark:bg-[#342218] min-h-[140px] placeholder:text-gray-400 dark:placeholder:text-[#cba490] p-4 text-base font-normal leading-relaxed"
                            placeholder="Tap to add manual notes about the work completed..."
                        ></textarea>
                    </label>
                </section>

                {/* AI Trigger */}
                <section className="py-4">
                    <button
                        onClick={handleGenerateSummary}
                        disabled={isGenerating || !summary.trim()}
                        className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-6 bg-gray-900 dark:bg-[#492f22] text-white gap-3 font-bold transition-all active:scale-[0.98] border border-white/5 shadow-lg disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-primary">auto_awesome</span>
                        <span className="truncate">{isGenerating ? "Generating..." : "Generate AI Summary"}</span>
                    </button>
                </section>

                <div className="h-10"></div>
            </main>

            {/* Footer */}
            <footer className="absolute bottom-0 left-0 right-0 p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-gray-200 dark:border-white/10 pb-8">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !summary}
                    className="w-full h-16 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-[0_8px_30px_rgb(242,89,13,0.3)] active:scale-95 transition-transform"
                >
                    <span className="truncate">{isSubmitting ? "Sending..." : "Send Update"}</span>
                    <span className="material-symbols-outlined">send</span>
                </button>
            </footer>
        </div>
    );
}
