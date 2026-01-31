"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

function encodeError(message: string) {
  return encodeURIComponent(message);
}

export async function createAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const orgName = String(formData.get("orgName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !orgName || !email || !password) {
    redirect(`/signup?error=${encodeError("Please fill in all fields.")}`);
  }

  if (password.length < 6) {
    redirect(`/signup?error=${encodeError("Password must be at least 6 characters.")}`);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    redirect(`/signup?error=${encodeError("An account with this email already exists.")}`);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const org = await tx.org.create({
      data: {
        name: orgName,
        plan: "SOLO",
      },
    });

    const user = await tx.user.create({
      data: {
        name,
        email,
        password: passwordHash,
      },
    });

    await tx.orgUser.create({
      data: {
        orgId: org.id,
        userId: user.id,
        role: "OWNER",
      },
    });
  });

  redirect("/login?created=1");
}
