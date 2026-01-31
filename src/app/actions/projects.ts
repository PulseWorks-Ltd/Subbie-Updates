"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

function encodeError(message: string) {
  return encodeURIComponent(message);
}

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const frequency = String(formData.get("frequency") ?? "WEEKLY").trim();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim();

  if (!name || !clientName || !clientEmail) {
    redirect(`/projects/new?error=${encodeError("Please fill in all fields.")}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { orgs: { include: { org: true } } },
  });

  if (!user || user.orgs.length === 0) {
    redirect(`/projects/new?error=${encodeError("No organization found for your account.")}`);
  }

  const orgId = user.orgs[0].org.id;

  const project = await prisma.project.create({
    data: {
      orgId,
      name,
      frequency: frequency as "WEEKLY" | "FORTNIGHTLY" | "MONTHLY",
      recipients: {
        create: {
          name: clientName,
          email: clientEmail,
        },
      },
    },
  });

  redirect(`/project/${project.id}/update`);
}

export async function addRecipient(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!name || !email) {
    redirect(`/project/${projectId}/settings?error=${encodeError("Please fill in all fields.")}`);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { org: { include: { users: true } } },
  });

  if (!project) {
    redirect(`/project/${projectId}/settings?error=${encodeError("Project not found.")}`);
  }

  const hasAccess = project.org.users.some((u) => u.userId === session.user?.id);
  if (!hasAccess) {
    redirect(`/project/${projectId}/settings?error=${encodeError("Unauthorized.")}`);
  }

  await prisma.recipient.create({
    data: {
      projectId,
      name,
      email,
    },
  });

  redirect(`/project/${projectId}/settings`);
}

export async function removeRecipient(projectId: string, recipientId: string) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { org: { include: { users: true } } },
  });

  if (!project) {
    redirect(`/project/${projectId}/settings?error=${encodeError("Project not found.")}`);
  }

  const hasAccess = project.org.users.some((u) => u.userId === session.user?.id);
  if (!hasAccess) {
    redirect(`/project/${projectId}/settings?error=${encodeError("Unauthorized.")}`);
  }

  await prisma.recipient.delete({
    where: { id: recipientId },
  });

  redirect(`/project/${projectId}/settings`);
}
