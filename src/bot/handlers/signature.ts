/* import Document from "../../models/documentsSchema"; */
import User from "../../models/userSchema";

import { bot } from "../index";
import { finalConfirmation } from "./final";
import { updateUserActivity, isSessionBlocked } from "../../services/sessionManager";
/* import { finalConfirmation } from "./final"; */
import { /* getSignedDocumentUrl, */ sendS3DocumentToUser, uploadTelegramFileToS3 } from "../../services/s3FileRequest";
import i18next from "i18next";

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
            bot.sendMessage(chatId, i18next.t("identity_step.session_closed"));
            return;
        }

        await updateUserActivity(userId, chatId);

        if (data === "firmar_si") {
            await bot.sendMessage(chatId, i18next.t("signature_step.upload_signature_prompt"));
            await User.findOneAndUpdate({ userId }, { awaitingFirmaUpload: true });
            await bot.answerCallbackQuery(query.id);
            return;
        }

        if (data === "firma_rechazar") {
            const docName = "documento.pdf"; // Insert filename logic here
            await bot.sendMessage(chatId, i18next.t("signature_step.rejected", { docName }));
            await User.findOneAndUpdate({ userId }, { awaitingFirmaUpload: false });
            await bot.answerCallbackQuery(query.id);
            return;
        }

        if (data === "enviar_firmado_si") {
            await bot.sendMessage(chatId, i18next.t("signature_step.signed_success"));
            await User.findOneAndUpdate({ userId }, { awaitingFirmaUpload: false });
            await bot.answerCallbackQuery(query.id);
            return;
        }

        if (data === "enviar_firmado_no") {
            await bot.sendMessage(chatId, i18next.t("signature_step.cancelled_send"));
            await User.findOneAndUpdate({ userId }, { awaitingFirmaUpload: false });
            await bot.answerCallbackQuery(query.id);
            return;
        }

        if (data === "enviar_firmado_si") {
            await bot.sendMessage(chatId, i18next.t("signature_step.signed_success"));
            await User.findOneAndUpdate({ userId }, { awaitingFirmaUpload: false });
            await finalConfirmation(chatId); 
            await bot.answerCallbackQuery(query.id);
            return;
        }

        if (data === "enviar_firmado_no") {
            await bot.sendMessage(chatId, i18next.t("signature_step.cancelled_send"));
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

        await bot.sendMessage(chatId, i18next.t("signature_step.signed_preview"));
        await sendS3DocumentToUser(chatId, S3_DOC_KEY, "documento_firmado.pdf");

        await bot.sendMessage(chatId, i18next.t("signature_step.send_question"), {
            reply_markup: {
                inline_keyboard: [
                    [{ text: i18next.t("signature_step.send_yes"), callback_data: "enviar_firmado_si" }],
                    [{ text: i18next.t("signature_step.send_no"), callback_data: "enviar_firmado_no" }]
                ]
            }
        });

        await User.findOneAndUpdate({ userId }, { awaitingFirmaUpload: false });

        
    });
}