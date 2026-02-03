"use server";

import { auth } from "@/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

const DEFAULT_MODEL_FALLBACKS = [
  process.env.GEMINI_MODEL,
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
].filter(Boolean) as string[];

async function generateWithFallback(prompt: string) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: unknown = null;

  for (const modelName of DEFAULT_MODEL_FALLBACKS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.error("Gemini generateContent failed", { model: modelName, message });

      if (!/not found|model|404/i.test(message)) {
        break;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to generate AI summary");
}

export async function generateAiSummary(input: {
  notes: string;
  projectName?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const prompt = `Summarize the update for the client in 3-5 bullet points.\n\nProject: ${input.projectName ?? "Unknown"}\nNotes: ${input.notes}`;
  const response = await generateWithFallback(prompt);

  return { summary: response.trim() };
}

export async function generateTasksCompletedSummary(input: {
  notes: string;
  jobName?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const prompt = `You are a construction assistant.
Generate a neutral, concise tasks-completed summary.
Rules:
- No time references.
- No cost references.
- No claims or legal language.
- No opinions or marketing.
- Output 1-2 sentences as plain text only.

Job: ${input.jobName ?? "Unknown"}
Notes: ${input.notes}`;

  const response = await generateWithFallback(prompt);

  return { summary: response.trim() };
}
