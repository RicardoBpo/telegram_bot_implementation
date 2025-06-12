import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { bot } from '../bot';

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export async function getSignedDocumentUrl(key: string, expiresInSeconds = 600): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
    });
    return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export async function sendS3DocumentToUser(chatId: number, key: string, fileName: string) {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
    });
    const s3Response = await s3.send(command);

    await bot.sendDocument(chatId, s3Response.Body as ReadableStream<Uint8Array>, {}, {
        filename: fileName,
        contentType: s3Response.ContentType || "application/pdf"
    });
}