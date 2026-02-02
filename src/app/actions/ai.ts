"use server";

import { auth } from "@/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export async function generateAiSummary(input: {
  notes: string;
  projectName?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

  const prompt = `Summarize the update for the client in 3-5 bullet points.\n\nProject: ${input.projectName ?? "Unknown"}\nNotes: ${input.notes}`;
  const result = await model.generateContent(prompt);
  const response = result.response.text();

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

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

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

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  return { summary: response.trim() };
}
