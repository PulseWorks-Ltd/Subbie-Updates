import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { getS3ReadStream } from "../../lib/s3";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function processTranscriptionJob(job: {
  id: string;
  payload: any;
}) {
  const { updateId, s3Key, projectName } = job.payload as {
    updateId: string;
    s3Key: string;
    projectName?: string;
  };

  if (!updateId || !s3Key) {
    throw new Error("Missing transcription payload fields");
  }

  const audioStream = await getS3ReadStream(s3Key);

  const transcription = await openai.audio.transcriptions.create({
    file: audioStream as any,
    model: "whisper-1",
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert construction assistant. Turn the following transcript into a professional status update for project "${projectName ?? "Unknown"}". Return ONLY a JSON object with: { "title": string, "summaryBullets": string[], "progress": string, "nextSteps": string }`,
      },
      {
        role: "user",
        content: transcription.text,
      },
    ],
  });

  const summary = JSON.parse(completion.choices[0].message.content || "{}");

  await prisma.update.update({
    where: { id: updateId },
    data: {
      transcript: transcription.text,
      summary: Array.isArray(summary.summaryBullets)
        ? summary.summaryBullets.join("\n")
        : transcription.text,
      progress: summary.progress,
      nextSteps: summary.nextSteps,
      title: summary.title || "Project Update",
    },
  });
}
