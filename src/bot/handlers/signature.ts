import Document from "../../models/documentsSchema";


import { bot } from "../index";
import { finalConfirmation } from "./final";
import { /* getSignedDocumentUrl, */ sendS3DocumentToUser } from "../../services/s3FileRequest";

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
        const photo = msg.photo?.[msg.photo.length - 1];
        if (!photo) return;

        await Document.create({
            userId: msg.from?.id,
            fileId: photo.file_id,
            fileName: "Firma"
        });

        const key = `documentos/${msg.from?.id}/documento.pdf`; //path to store the document in S3
        await sendS3DocumentToUser(msg.chat.id, key, "document.pdf");
        //ONLY SEND THE URL TO THE USER 
        /* 
        const url = await getSignedDocumentUrl(key);
        await bot.sendMessage(msg.chat.id, `Aquí tienes tu documento:\n${url}`);
        */

        finalConfirmation(msg.chat.id, true);
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

        const key = `documentos/${msg.from?.id}/documento.pdf`; //path to store the document in S3
        await sendS3DocumentToUser(msg.chat.id, key, "document.pdf");
        //ONLY SEND THE URL TO THE USER 
        /* 
        const url = await getSignedDocumentUrl(key);
        await bot.sendMessage(msg.chat.id, `Aquí tienes tu documento:\n${url}`);
        */

        finalConfirmation(msg.chat.id, true);
    });

    bot.on("callback_query", async (query) => {
        if (query.data === "firma_rechazar") {
            const chatId = query.message?.chat.id;
            if (chatId) {
                finalConfirmation(chatId, false);
            }
            await bot.answerCallbackQuery(query.id);
        }
    });
}