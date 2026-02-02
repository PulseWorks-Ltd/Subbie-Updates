"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function createJobImages(
  jobId: string,
  images: { s3Key: string; mimeType: string; takenAt: string }[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;
  const prismaAny = prisma as any;

  const project = await prisma.project.findUnique({
    where: { id: jobId },
    include: { org: { include: { users: true } } },
  });

  if (!project) throw new Error("Job not found");

  const hasAccess = project.org.users.some(
    (u: typeof project.org.users[0]) => u.userId === session.user?.id
  );
  if (!hasAccess) throw new Error("Unauthorized access to job");

  if (images.length === 0) return { count: 0 };

  const created = await prismaAny.image.createMany({
    data: images.map((img) => ({
      jobId,
      s3Key: img.s3Key,
      mimeType: img.mimeType,
      takenAt: new Date(img.takenAt),
      uploadedBy: userId,
    })),
  });

  revalidatePath(`/jobs/${jobId}`);
  return { count: created.count };
}

export async function getJobImagesForAttachment(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const prismaAny = prisma as any;

  const project = await prisma.project.findUnique({
    where: { id: jobId },
    include: { org: { include: { users: true } } },
  });
  if (!project) throw new Error("Job not found");

  const hasAccess = project.org.users.some(
    (u: typeof project.org.users[0]) => u.userId === session.user?.id
  );
  if (!hasAccess) throw new Error("Unauthorized access to job");

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const images = await prismaAny.image.findMany({
    where: {
      jobId,
      assignedUpdateId: null,
      sentAt: null,
      takenAt: { gte: since },
    },
    orderBy: { takenAt: "desc" },
    take: 30,
  });

  const signed = await Promise.all(
    images.map(async (img: { id: string; s3Key: string; takenAt: Date }) => {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: img.s3Key,
      });
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return {
        id: img.id,
        url,
        takenAt: img.takenAt.toISOString(),
      };
    })
  );

  return signed;
}

export async function saveJobUpdateDraft(input: {
  jobId: string;
  summary: string;
  imageIds: string[];
  draftId?: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const project = await prisma.project.findUnique({
    where: { id: input.jobId },
    include: { org: { include: { users: true } } },
  });
  if (!project) throw new Error("Job not found");

  const hasAccess = project.org.users.some(
    (u: typeof project.org.users[0]) => u.userId === session.user?.id
  );
  if (!hasAccess) throw new Error("Unauthorized access to job");

  const result = await prisma.$transaction(async (tx) => {
    const txAny = tx as any;
    let updateId = input.draftId ?? null;

    if (updateId) {
      const existing = await txAny.update.findUnique({
        where: { id: updateId },
      });
      if (!existing || (existing as { status?: string }).status !== "DRAFT") {
        throw new Error("Draft not found");
      }

      await txAny.update.update({
        where: { id: updateId },
        data: { summary: input.summary },
      });

      await txAny.updateImage.deleteMany({ where: { updateId } });
    } else {
      const created = await txAny.update.create({
        data: {
          projectId: input.jobId,
          authorId: userId,
          summary: input.summary,
          status: "DRAFT",
        },
      });
      updateId = created.id;
    }

    if (input.imageIds.length > 0) {
      await txAny.updateImage.createMany({
        data: input.imageIds.map((imageId) => ({
          updateId: updateId as string,
          imageId,
        })),
        skipDuplicates: true,
      });
    }

    return updateId as string;
  });

  revalidatePath(`/jobs/${input.jobId}`);
  return { updateId: result };
}

export async function sendJobUpdate(input: {
  jobId: string;
  summary: string;
  imageIds: string[];
  draftId?: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const project = await prisma.project.findUnique({
    where: { id: input.jobId },
    include: { org: { include: { users: true } } },
  });
  if (!project) throw new Error("Job not found");

  const hasAccess = project.org.users.some(
    (u: typeof project.org.users[0]) => u.userId === session.user?.id
  );
  if (!hasAccess) throw new Error("Unauthorized access to job");

  const now = new Date();

  const updateId = await prisma.$transaction(async (tx) => {
    const txAny = tx as any;
    let id = input.draftId ?? null;

    if (id) {
      const existing = await txAny.update.findUnique({ where: { id } });
      if (!existing || (existing as { status?: string }).status !== "DRAFT") {
        throw new Error("Draft not found");
      }

      await txAny.update.update({
        where: { id },
        data: {
          summary: input.summary,
          status: "SENT",
          sentAt: now,
        },
      });

      await txAny.updateImage.deleteMany({ where: { updateId: id } });
    } else {
      const created = await txAny.update.create({
        data: {
          projectId: input.jobId,
          authorId: userId,
          summary: input.summary,
          status: "SENT",
          sentAt: now,
        },
      });
      id = created.id;
    }

    if (input.imageIds.length > 0) {
      await txAny.updateImage.createMany({
        data: input.imageIds.map((imageId) => ({
          updateId: id as string,
          imageId,
        })),
        skipDuplicates: true,
      });

      await txAny.image.updateMany({
        where: { id: { in: input.imageIds }, assignedUpdateId: null },
        data: { assignedUpdateId: id as string, sentAt: now },
      });
    }

    return id as string;
  });

  revalidatePath(`/jobs/${input.jobId}`);
  return { updateId };
}
