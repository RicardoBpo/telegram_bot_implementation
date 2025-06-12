import Document from "../../models/documentsSchema";
import User from "../../models/userSchema";

import { bot } from "../index";
import { finalConfirmation } from "./final";
import { /* getSignedDocumentUrl, */ sendS3DocumentToUser, uploadTelegramFileToS3 } from "../../services/s3FileRequest";

export function askSignature(chatId: number) {
    bot.sendMessage(chatId, "Por favor, sube una foto de tu firma o pulsa 'Rechazar'.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "❌ Rechazar", callback_data: "firma_rechazar" }]
            ]
        }
    });
}

export function setupSignatureHandler() {
    bot.on("photo", async (msg) => {
        
        const userId = msg.from?.id;
        const user = await User.findOne({ userId });
        
        if (user?.identityStep !== "done") return;

        const photo = msg.photo?.[msg.photo.length - 1];
        if (!photo) return;

        await Document.create({
            userId: msg.from?.id,
            fileId: photo.file_id,
            fileName: "Firma"
        });

        // Get the file extension
        const file = await bot.getFile(photo.file_id);
        const filePath = file.file_path || "";
        const extension = filePath.split('.').pop() || "jpg";

        const s3Key = `_assets/docs/twilio-media/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`; //path to store the signature in S3
        await uploadTelegramFileToS3(photo.file_id, s3Key);

        const key = `_assets/docs/telegram_test_doc.pdf`; //path where files store in S3
        await sendS3DocumentToUser(msg.chat.id, key, "document.pdf");
        await bot.sendMessage(msg.chat.id, "¿Quieres firmar este documento?", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ Sí, firmar", callback_data: "firmar_si" }],
                    [{ text: "❌ Rechazar", callback_data: "firma_rechazar" }]
                ]
            }
        });
        //ONLY SEND THE URL TO THE USER 
        /* 
        const url = await getSignedDocumentUrl(key);
        await bot.sendMessage(msg.chat.id, `Aquí tienes tu documento:\n${url}`);
        */
    });

    bot.on("document", async (msg) => {
        const doc = msg.document;
        if (!doc) return;

        const allowedMimeTypes = [
            "application/pdf",
            "application/msword",
        ];
        if (!allowedMimeTypes.includes(doc.mime_type || "")) {
            bot.sendMessage(msg.chat.id, "Solo se aceptan archivos PDF o Word (.doc, .docx).");
            return;
        }

        await Document.create({
            userId: msg.from?.id,
            fileId: doc.file_id,
            fileName: doc.file_name
        });

        const file = await bot.getFile(doc.file_id);
        const filePath = file.file_path || "";
        const extension = filePath.split('.').pop() || "pdf";
        
        const s3Key = `_assets/docs/twilio-media/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`; //path to store the signature in S3
        await uploadTelegramFileToS3(doc.file_id, s3Key);
        
        const key = `documentos/${msg.from?.id}/documento.pdf`; //path to store the document in S3
        await sendS3DocumentToUser(msg.chat.id, key, "document.pdf");
        await bot.sendMessage(msg.chat.id, "¿Quieres firmar este documento?", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ Sí, firmar", callback_data: "firmar_si" }],
                    [{ text: "❌ Rechazar", callback_data: "firma_rechazar" }]
                ]
            }
        });
        //ONLY SEND THE URL TO THE USER 
        /* 
        const url = await getSignedDocumentUrl(key);
        await bot.sendMessage(msg.chat.id, `Aquí tienes tu documento:\n${url}`);
        */
    });

    bot.on("callback_query", async (query) => {
        const chatId = query.message?.chat.id;
        const messageId = query.message?.message_id;

        if (!chatId) return;

        if (query.data === "firma_rechazar") {
            // Delete the message and display signature prompt again
            await bot.deleteMessage(chatId, messageId!);
            askSignature(chatId);
            await bot.answerCallbackQuery(query.id);
        }

        if (query.data === "firmar_si") {
            finalConfirmation(chatId, true);
            await bot.answerCallbackQuery(query.id);
        
        }
    });
}