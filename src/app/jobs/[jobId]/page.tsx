import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { JobUpdateFlow } from "@/components/feature/JobUpdateFlow";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { jobId } = await params;

  const job = await prisma.project.findUnique({
    where: { id: jobId },
    include: { org: { include: { users: true } } },
  });

  if (!job) return <div className="p-6">Job not found</div>;

  const hasAccess = job.org.users.some(
    (u: typeof job.org.users[0]) => u.userId === session.user?.id
  );
  if (!hasAccess) return <div className="p-6">Unauthorized</div>;

  const prismaAny = prisma as any;

  const updates = await prismaAny.update.findMany({
    where: { projectId: jobId },
    orderBy: { createdAt: "desc" },
    include: {
      updateImages: {
        include: { image: true },
      },
    },
  });

  const updatesWithImages = await Promise.all(
    updates.map(async (update: { id: string; summary: string; status: string; createdAt: Date; sentAt?: Date | null; updateImages: { image: { id: string; s3Key: string } }[] }) => {
      const imageUrls = await Promise.all(
        update.updateImages.map(async (link: { image: { id: string; s3Key: string } }) => {
          const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: link.image.s3Key,
          });
          const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
          return {
            id: link.image.id,
            url,
          };
        })
      );

      return {
        id: update.id,
        summary: update.summary,
        status: update.status,
        createdAt: update.createdAt.toISOString(),
        sentAt: update.sentAt ? update.sentAt.toISOString() : null,
        imageCount: imageUrls.length,
        images: imageUrls,
      };
    })
  );

  return (
    <JobUpdateFlow
      jobId={job.id}
      jobName={job.name}
      updates={updatesWithImages}
    />
  );
}
