"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/auth";

function encodeError(message: string) {
  return encodeURIComponent(message);
}

function isNextRedirect(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const digest = (error as { digest?: string }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export async function loginWithCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/login?error=${encodeError("Please enter your email and password.")}`);
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    redirect(`/login?error=${encodeError("Sign in failed. Check your details and try again.")}`);
  }
}
