"use server";

import { auth } from "@/auth";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

export async function transcribeAudio(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Audio file is required");
  }

  const client = new OpenAI({ apiKey });

  const transcription = await client.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });

  return { text: transcription.text };
}
