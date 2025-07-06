import { bot } from "../index";
import { sendPrivacyPolicy } from "../handlers/terms";
/* import { askSignature } from "../handlers/signature"; */
import { askCountry, askDocumentType, askDocumentPhoto, askSelfie } from "../handlers/identity";
import { sendS3DocumentToUser } from "../../services/s3FileRequest";
import { resetSession } from "../../services/sessionManager";

import User from "../../models/userSchema";

const S3_DOC_KEY = `_assets/docs/telegram_test_doc.pdf`;

export function setupStartCommand() {

    /* Start flow, if the user accepts the terms, the flow continues */
    bot.onText(/\/start(?:\s(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const phone = match?.[1];
        const acceptedTerms = await User.findOne({ userId: msg.from?.id, termsAccepted: true });
        const userName = msg.from?.first_name

        await resetSession(msg.from?.id);

        if (acceptedTerms) {
            bot.sendMessage(chatId, `¡Hola ${userName}! Ya aceptaste los términos y condiciones. Continúa con el proceso.`);

            const user = await User.findOne({ userId: msg.from?.id });

            if (!user?.identityStep) {
                setTimeout(() => {
                    askCountry(chatId);
                }, 1000);
            } else if (user.identityStep === "documentType") {
                setTimeout(() => {
                    askDocumentType(chatId);
                }, 1000);
            } else if (user.identityStep === "documentPhoto") {
                setTimeout(() => {
                    askDocumentPhoto(chatId);
                }, 1000);
            } else if (user.identityStep === "selfie") {
                setTimeout(() => {
                    askSelfie(chatId);
                }, 1000);
            } else if (user.identityStep === "done") {
                setTimeout(async () => {
                    await bot.sendMessage(chatId, "Este será el documento que vas a firmar:");
                    await sendS3DocumentToUser(chatId, S3_DOC_KEY, "documento.pdf");
                    await bot.sendMessage(chatId, "¿Quieres firmar este documento?", {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "✅ Sí, firmar", callback_data: "firmar_si" }],
                                [{ text: "❌ Rechazar", callback_data: "firma_rechazar" }]
                            ]
                        }
                    });
                }, 1000);
            }
            return;
        }

        if (phone) {
            await User.findOneAndUpdate(
                { userId: msg.from?.id },
                { phoneNumber: phone, userName: msg.from?.username, userId: msg.from?.id },
                { upsert: true }
            );
        }

        sendPrivacyPolicy(chatId, msg.from?.first_name || msg.from?.username);
    });
}