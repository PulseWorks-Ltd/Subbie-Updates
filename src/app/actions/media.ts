
// src/app/actions/media.ts
"use server";

import { auth } from "@/auth";
import { s3 } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export async function getPresignedUrl(filename: string, contentType: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Generate a unique key
    // Structure: uploads/{orgId}/{projectId}/{uuid}-{filename}
    // For now generic: uploads/{uuid}-{filename}
    const key = `uploads/${randomUUID()}-${filename}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return { signedUrl, key };
}
