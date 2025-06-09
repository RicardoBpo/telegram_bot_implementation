
/* import { bot } from "../bot";

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

export async function sendS3File(chatId: number) {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: "archivo.pdf", // Cambia por el nombre real
    };
    const url = s3.getSignedUrl("getObject", params);
    await bot.sendMessage(chatId, `Aquí tienes el archivo: ${url}`);
} */