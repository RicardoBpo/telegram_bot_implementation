/* import Document from "../../models/documentsSchema"; */
import User from "../../models/userSchema";

import { bot } from "../index";
import { finalConfirmation } from "./final";
import { updateUserActivity, isSessionBlocked } from "../../services/sessionManager";
/* import { finalConfirmation } from "./final"; */
import { /* getSignedDocumentUrl, */ sendS3DocumentToUser, uploadTelegramFileToS3 } from "../../services/s3FileRequest";

const S3_DOC_KEY = `_assets/docs/telegram_test_doc.pdf`;

/* export function askSignature(chatId: number) {
    bot.sendMessage(chatId, "Por favor, sube una foto de tu firma o pulsa 'Rechazar'.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "❌ Rechazar", callback_data: "firma_rechazar" }]
            ]
        }
    });
} */

/* async function listUserDocuments(userId: number) {
    return await Document.find({ userId });
} */


export function setupSignatureHandler() {
    bot.on("callback_query", async (query) => {
        const data = query.data;
        const chatId = query.message?.chat.id;
        const userId = query.from?.id;
        const user = await User.findOne({ userId });

        if (!data || !chatId || !userId) return;

        if (isSessionBlocked(user)) {
            bot.sendMessage(chatId, "Tu sesión fue cerrada por inactividad. Por favor, inicia el proceso de nuevo con /start.");
            return;
        }

        await updateUserActivity(userId, chatId);

        if (data === "firmar_si") {
            await bot.sendMessage(chatId, "Por favor, sube una foto de tu firma.");
            await User.findOneAndUpdate({ userId }, { awaitingFirmaUpload: true });
            await bot.answerCallbackQuery(query.id);
            return;
        }

        if (data === "firma_rechazar") {
            const docName = "documento.pdf"; // Insert filename logic here
            await bot.sendMessage(chatId, `Has rechazado firmar el documento 📄 ${docName}.`);
            await User.findOneAndUpdate({ userId }, { awaitingFirmaUpload: false });
            await bot.answerCallbackQuery(query.id);
            return;
        }

        if (data === "enviar_firmado_si") {
            await bot.sendMessage(chatId, "¡Documento firmado y enviado exitosamente! 🎉");
            await User.findOneAndUpdate({ userId }, { awaitingFirmaUpload: false });
            await bot.answerCallbackQuery(query.id);
            return;
        }

        if (data === "enviar_firmado_no") {
            await bot.sendMessage(chatId, "El envío del documento firmado ha sido cancelado.");
            await User.findOneAndUpdate({ userId }, { awaitingFirmaUpload: false });
            await bot.answerCallbackQuery(query.id);
            return;
        }

        if (data === "enviar_firmado_si") {
            await bot.sendMessage(chatId, "¡Documento firmado y enviado exitosamente! 🎉");
            await User.findOneAndUpdate({ userId }, { awaitingFirmaUpload: false });
            await finalConfirmation(chatId); 
            await bot.answerCallbackQuery(query.id);
            return;
        }

        if (data === "enviar_firmado_no") {
            await bot.sendMessage(chatId, "El envío del documento firmado ha sido cancelado.");
            await User.findOneAndUpdate({ userId }, { awaitingFirmaUpload: false });
            await finalConfirmation(chatId);
            await bot.answerCallbackQuery(query.id);
            return;
        }
    });

    bot.on("photo", async (msg) => {
        const userId = msg.from?.id;
        const user = await User.findOne({ userId });
        const chatId = msg.chat.id;

        if (!user?.awaitingFirmaUpload) return;

        const photo = msg.photo?.[msg.photo.length - 1];
        if (!photo) return;

        // Subir la firma a S3
        const file = await bot.getFile(photo.file_id);
        const filePath = file.file_path || "";
        const extension = filePath.split('.').pop() || "jpg";
        const s3Key = `_assets/docs/twilio-media/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
        await uploadTelegramFileToS3(photo.file_id, s3Key);

        await bot.sendMessage(chatId, "Este es tu documento firmado:");
        await sendS3DocumentToUser(chatId, S3_DOC_KEY, "documento_firmado.pdf");

        await bot.sendMessage(chatId, "¿Quieres enviarlo?", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ Sí, enviar", callback_data: "enviar_firmado_si" }],
                    [{ text: "❌ No enviar", callback_data: "enviar_firmado_no" }]
                ]
            }
        });

        await User.findOneAndUpdate({ userId }, { awaitingFirmaUpload: false });

        
    });
}