import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { s3Key } = body || {};

  if (!s3Key) {
    return NextResponse.json({ error: "Missing s3Key" }, { status: 400 });
  }

  const job = await prisma.jobQueue.create({
    data: {
      type: "IMAGE_OPTIMIZE",
      status: "PENDING",
      payload: { s3Key },
    },
  });

  return NextResponse.json({ jobId: job.id });
}
