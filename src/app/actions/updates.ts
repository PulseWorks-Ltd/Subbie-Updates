
// src/app/actions/updates.ts
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendUpdateEmail } from "@/lib/sendgrid";

export async function createUpdate(projectId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Note: Add strict tenant check here if orgId is available in session
    // For now, checking if user has access to the project via Org
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { org: { include: { users: true } }, recipients: true }
    });

    if (!project) throw new Error("Project not found");

    const hasAccess = project.org.users.some((u: typeof project.org.users[0]) => u.userId === session.user?.id);
    if (!hasAccess) throw new Error("Unauthorized access to project");

    const summary = formData.get("summary") as string;
    const s3Keys = formData.getAll("s3Keys") as string[];
    // We'll pass s3Keys as hidden attributes or a JSON string from client

    // Actually, cleaner to receive a structured object if not using native form action directly
    // But let's stick to parsing FormData or arguments.
}

// Better approach: Server Action receiving data object
export async function submitUpdateAction(projectId: string, data: { summary: string, assets: { key: string, types: string }[] }) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Strict Tenant Check
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { org: { include: { users: true } } }
    });

    if (!project) throw new Error("Project not found");
    const hasAccess = project.org.users.some((u: typeof project.org.users[0]) => u.userId === session.user?.id);
    if (!hasAccess) throw new Error("Unauthorized access to project");

    const update = await prisma.update.create({
        data: {
            projectId,
            authorId: session.user.id,
            summary: data.summary,
            // assets: {
            //     create: data.assets.map(a => ({
            //         s3Key: a.key,
            //         mimeType: a.types
            //     }))
            // }
            // Prisma 7/Postgres relation syntax might vary, generic standard:
            assets: {
                create: data.assets.map(a => ({
                    s3Key: a.key,
                    mimeType: a.types
                }))
            }
        }
    });

    revalidatePath(`/dashboard`);
    revalidatePath(`/project/${projectId}/update`);

    const appUrl =
        process.env.APP_URL ||
        process.env.AUTH_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";

    const shareUrl = `${appUrl}/view/${update.publicToken}`;

    if (project.recipients.length > 0 && process.env.SENDGRID_FROM_EMAIL) {
        await Promise.all(
            project.recipients.map((recipient) =>
                sendUpdateEmail({
                    to: recipient.email,
                    from: process.env.SENDGRID_FROM_EMAIL as string,
                    subject: `Update for ${project.name}`,
                    text: `Hi ${recipient.name},\n\nA new update is ready for ${project.name}.\n\nSummary:\n${data.summary}\n\nView the update: ${shareUrl}`,
                })
            )
        );
    }

    return { success: true, updateId: update.id, publicToken: update.publicToken };
}
