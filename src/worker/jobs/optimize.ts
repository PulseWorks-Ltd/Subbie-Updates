export async function processImageJob(job: { id: string; payload: any }) {
  const { s3Key } = job.payload as { s3Key?: string };
  if (!s3Key) {
    throw new Error("Missing image payload fields");
  }

  // TODO: Implement image optimization pipeline (resize/compress) and write back to S3.
  return;
}
