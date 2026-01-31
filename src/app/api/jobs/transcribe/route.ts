import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { updateId, s3Key, projectName } = body || {};

  if (!updateId || !s3Key) {
    return NextResponse.json({ error: "Missing updateId or s3Key" }, { status: 400 });
  }

  const job = await prisma.jobQueue.create({
    data: {
      type: "TRANSCRIPTION",
      status: "PENDING",
      payload: { updateId, s3Key, projectName },
    },
  });

  return NextResponse.json({ jobId: job.id });
}
