// src/lib/s3.ts
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";

export const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function getS3ReadStream(key: string) {
    const bucket = process.env.AWS_S3_BUCKET_NAME;
    if (!bucket) {
        throw new Error("AWS_S3_BUCKET_NAME is not set");
    }

    const response = await s3.send(
        new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );

    if (!response.Body) {
        throw new Error("S3 object has no body");
    }

    return response.Body as Readable;
}
