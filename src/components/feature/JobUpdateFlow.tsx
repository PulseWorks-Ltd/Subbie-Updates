"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getPresignedUrl } from "@/app/actions/media";
import {
  createJobImages,
  getJobImagesForAttachment,
  saveJobUpdateDraft,
  sendJobUpdate,
} from "@/app/actions/job-updates";
import { generateTasksCompletedSummary } from "@/app/actions/ai";

interface JobUpdateFlowProps {
  jobId: string;
  jobName: string;
  updates: JobUpdateSummary[];
}

interface JobUpdateSummary {
  id: string;
  summary: string;
  status: "DRAFT" | "SENT";
  createdAt: string;
  sentAt?: string | null;
  imageCount: number;
  images: { id: string; url: string }[];
}

interface AvailableImage {
  id: string;
  url: string;
  takenAt: string;
}

type FlowStep = "idle" | "notes" | "review" | "post-photos";

type SpeechRecognitionLike = {
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  lang: string;
  interimResults: boolean;
  continuous: boolean;
};

export function JobUpdateFlow({ jobId, jobName, updates }: JobUpdateFlowProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<FlowStep>("idle");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableImages, setAvailableImages] = useState<AvailableImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showPhotoConfirm, setShowPhotoConfirm] = useState(false);
  const [isSavingPhotos, setIsSavingPhotos] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "unsupported">("idle");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<File[]>([]);
  const [expandedUpdateId, setExpandedUpdateId] = useState<string | null>(null);

  const canSubmit = summary.trim().length > 0;

  const previewUrls = useMemo(
    () => pendingFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    })),
    [pendingFiles]
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previewUrls]);

  const loadAvailableImages = useCallback(async () => {
    try {
      const images = await getJobImagesForAttachment(jobId);
      setAvailableImages(images);
    } catch (error) {
      console.error(error);
    }
  }, [jobId]);

  useEffect(() => {
    const handleOnline = async () => {
      if (offlineQueue.length === 0) return;
      try {
        await uploadFiles(offlineQueue);
        setOfflineQueue([]);
        setInfoMessage("Queued photos uploaded.");
        await loadAvailableImages();
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to upload queued photos.");
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [offlineQueue, loadAvailableImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setPendingFiles(Array.from(e.target.files));
    setShowPhotoConfirm(true);
    e.target.value = "";
  };

  const uploadFiles = async (files: File[]) => {
    const uploads = [] as { s3Key: string; mimeType: string; takenAt: string }[];

    for (const file of files) {
      const { signedUrl, key } = await getPresignedUrl(file.name, file.type);
      await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      uploads.push({
        s3Key: key,
        mimeType: file.type,
        takenAt: new Date().toISOString(),
      });
    }

    await createJobImages(jobId, uploads);
  };

  const handleSavePhotos = async () => {
    if (pendingFiles.length === 0) return;
    setIsSavingPhotos(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOfflineQueue((prev) => [...prev, ...pendingFiles]);
        setInfoMessage("You are offline. Photos will upload when you are back online.");
      } else {
        await uploadFiles(pendingFiles);
        await loadAvailableImages();
      }

      setPendingFiles([]);
      setShowPhotoConfirm(false);
      setStep("post-photos");
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to save photos. Please try again.");
    } finally {
      setIsSavingPhotos(false);
    }
  };

  const startRecording = () => {
    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      setRecordingStatus("unsupported");
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((result: any) => result[0]?.transcript ?? "")
        .join(" ");
      setNotes((prev) => (prev ? `${prev}\n${transcript}` : transcript));
    };

    recognition.onend = () => {
      setRecordingStatus("idle");
    };

    recognition.onerror = () => {
      setRecordingStatus("idle");
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecordingStatus("recording");
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  };

  const handleGenerateSummary = async () => {
    if (!notes.trim()) return;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const result = await generateTasksCompletedSummary({ notes, jobName });
      if (result?.summary) {
        setSummary(result.summary);
      } else {
        setSummary(notes);
      }
      setStep("review");
      await loadAvailableImages();
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to generate summary. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleImageSelection = (id: string) => {
    setSelectedImageIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveDraft = async () => {
    if (!canSubmit) return;
    await saveJobUpdateDraft({
      jobId,
      summary,
      imageIds: selectedImageIds,
      draftId: activeDraftId,
    });

    resetFlow();
    router.refresh();
  };

  const handleSendUpdate = async () => {
    if (!canSubmit) return;
    await sendJobUpdate({
      jobId,
      summary,
      imageIds: selectedImageIds,
      draftId: activeDraftId,
    });

    resetFlow();
    router.refresh();
  };

  const resetFlow = () => {
    setStep("idle");
    setNotes("");
    setSummary("");
    setSelectedImageIds([]);
    setActiveDraftId(null);
    setAvailableImages([]);
  };

  const handleEditDraft = (update: JobUpdateSummary) => {
    setSummary(update.summary);
    setSelectedImageIds(update.images.map((img) => img.id));
    setActiveDraftId(update.id);
    setStep("review");
    loadAvailableImages();
  };

  const oneLineSummary = (text: string) => {
    const line = text.split("\n").find((l) => l.trim().length > 0) || text;
    return line.length > 90 ? `${line.slice(0, 90)}…` : line;
  };

  return (
    <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
      />

      <header className="sticky top-0 z-20 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 py-4">
        <h1 className="text-xl font-bold">{jobName}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Job diary</p>
      </header>

      <main className="flex-1 px-4 pb-32 pt-4 space-y-6">
        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-600 px-4 py-3 text-sm">
            {errorMessage}
          </div>
        )}
        {infoMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm">
            {infoMessage}
          </div>
        )}

        {step === "idle" && (
          <section className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <button
                className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-4 text-left shadow-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-sm font-semibold">📸 Take / Upload Photos</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Save progress images to this job</p>
              </button>
              <button
                className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-4 text-left shadow-sm"
                onClick={() => setStep("notes")}
              >
                <p className="text-sm font-semibold">🎙 Record Site Notes</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Speak or type observations</p>
              </button>
              <button
                className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-4 text-left shadow-sm"
                onClick={() => setStep("notes")}
              >
                <p className="text-sm font-semibold">📝 Add Written Notes</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Draft notes anytime</p>
              </button>
            </div>
          </section>
        )}

        {step === "post-photos" && (
          <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 space-y-3">
            <p className="text-sm font-semibold">Photos saved to {jobName}</p>
            <div className="grid grid-cols-1 gap-2">
              <button
                className="w-full rounded-xl bg-primary text-white py-3 text-sm font-semibold"
                onClick={() => setStep("notes")}
              >
                Add notes for these images
              </button>
              <button
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 py-3 text-sm font-semibold"
                onClick={() => setStep("notes")}
              >
                Record site notes
              </button>
              <button
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 py-3 text-sm font-semibold"
                onClick={() => setStep("idle")}
              >
                Finish for now
              </button>
            </div>
          </section>
        )}

        {step === "notes" && (
          <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Site notes</p>
              <textarea
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm min-h-[140px]"
                placeholder="What work was completed today?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {recordingStatus === "recording" ? (
                <button
                  className="rounded-full bg-primary text-white px-4 py-2 text-xs font-semibold"
                  onClick={stopRecording}
                >
                  Stop recording
                </button>
              ) : (
                <button
                  className="rounded-full border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-semibold"
                  onClick={startRecording}
                >
                  🎙 Start recording
                </button>
              )}
              {recordingStatus === "unsupported" && (
                <p className="text-xs text-slate-500 dark:text-slate-400">Speech not supported.</p>
              )}
            </div>

            <button
              className="w-full rounded-xl bg-primary text-white py-3 text-sm font-semibold disabled:opacity-50"
              disabled={!notes.trim() || isGenerating}
              onClick={handleGenerateSummary}
            >
              {isGenerating ? "Generating summary…" : "Generate summary"}
            </button>
          </section>
        )}

        {step === "review" && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 space-y-3">
              <p className="text-sm font-semibold">Tasks completed summary</p>
              <textarea
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm min-h-[140px]"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Attach photos from this job (last 30 days)</p>
                <button
                  className="text-xs font-semibold text-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📸 Take photos now
                </button>
              </div>

              {availableImages.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">No unused photos found for this job.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      className={`relative aspect-square rounded-lg overflow-hidden border ${
                        selectedImageIds.includes(img.id)
                          ? "border-primary"
                          : "border-slate-200 dark:border-white/10"
                      }`}
                      onClick={() => toggleImageSelection(img.id)}
                    >
                      <Image src={img.url} alt="Job" fill className="object-cover" />
                      {selectedImageIds.includes(img.id) && (
                        <span className="absolute top-1 right-1 size-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 py-3 text-sm font-semibold"
                disabled={!canSubmit}
                onClick={handleSaveDraft}
              >
                Save draft
              </button>
              <button
                className="w-full rounded-xl bg-primary text-white py-3 text-sm font-semibold"
                disabled={!canSubmit}
                onClick={handleSendUpdate}
              >
                Send update
              </button>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Weekly updates</h2>
          {updates.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No updates yet.</p>
          ) : (
            <div className="space-y-3">
              {updates.map((update) => (
                <div
                  key={update.id}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(update.sentAt ?? update.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-semibold">{oneLineSummary(update.summary)}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Ref: Update #{update.id}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                        update.status === "SENT"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {update.status === "SENT" ? "Sent" : "Draft"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {update.imageCount} image{update.imageCount === 1 ? "" : "s"}
                  </p>

                  {expandedUpdateId === update.id && (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm whitespace-pre-wrap">
                        {update.summary}
                      </div>
                      {update.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {update.images.map((img) => (
                            <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                              <Image src={img.url} alt="Update" fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    {update.status === "DRAFT" ? (
                      <button
                        className="text-xs font-semibold text-primary"
                        onClick={() => handleEditDraft(update)}
                      >
                        Edit draft
                      </button>
                    ) : (
                      <button
                        className="text-xs font-semibold text-primary"
                        onClick={() =>
                          setExpandedUpdateId((prev) => (prev === update.id ? null : update.id))
                        }
                      >
                        {expandedUpdateId === update.id ? "Hide details" : "View details"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showPhotoConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-background-dark border border-slate-200 dark:border-white/10 p-4 space-y-3">
            <p className="text-sm font-semibold">
              Save {pendingFiles.length} image{pendingFiles.length === 1 ? "" : "s"} to {jobName}?
            </p>
            {previewUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {previewUrls.map((preview) => (
                  <div key={preview.url} className="relative size-16 rounded-lg overflow-hidden border border-slate-200">
                    <Image src={preview.url} alt={preview.name} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 py-3 text-sm font-semibold"
                onClick={() => {
                  setPendingFiles([]);
                  setShowPhotoConfirm(false);
                  router.push("/projects");
                }}
              >
                Choose different job
              </button>
              <button
                className="w-full rounded-xl bg-primary text-white py-3 text-sm font-semibold"
                disabled={isSavingPhotos}
                onClick={handleSavePhotos}
              >
                {isSavingPhotos ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
