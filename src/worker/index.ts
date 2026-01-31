import { PrismaClient, JobStatus, JobType } from "@prisma/client";
import { processTranscriptionJob } from "./jobs/transcribe";
import { processImageJob } from "./jobs/optimize";

const prisma = new PrismaClient();
const POLL_INTERVAL = 3000;

async function main() {
  console.log("🚀 Worker service started. Polling for jobs...");

  while (true) {
    try {
      const job = await prisma.$transaction(async (tx) => {
        const pendingJob = await tx.$queryRaw<
          { id: string }[]
        >`SELECT "id" FROM "JobQueue" WHERE "status" = 'PENDING' AND "runAt" <= NOW() ORDER BY "createdAt" ASC LIMIT 1 FOR UPDATE SKIP LOCKED`;

        if (pendingJob.length === 0) return null;

        return await tx.jobQueue.update({
          where: { id: pendingJob[0].id },
          data: {
            status: JobStatus.RUNNING,
            attempts: { increment: 1 },
            updatedAt: new Date(),
          },
        });
      });

      if (!job) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
        continue;
      }

      console.log(`📦 Processing job ${job.id} (${job.type})`);

      try {
        if (job.type === JobType.TRANSCRIPTION) {
          await processTranscriptionJob(job);
        } else if (job.type === JobType.IMAGE_OPTIMIZE) {
          await processImageJob(job);
        }

        await prisma.jobQueue.update({
          where: { id: job.id },
          data: { status: JobStatus.SUCCEEDED },
        });
      } catch (error: any) {
        console.error(`❌ Job ${job.id} failed:`, error.message ?? error);

        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: job.attempts >= 3 ? JobStatus.FAILED : JobStatus.PENDING,
            lastError: error?.message ?? "Unknown error",
            runAt: new Date(Date.now() + Math.pow(2, job.attempts) * 60000),
          },
        });
      }
    } catch (error) {
      console.error("CRITICAL: Worker loop error", error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

main();
