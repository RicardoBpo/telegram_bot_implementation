import { bot } from "../index";
import { sendPrivacyPolicy } from "../handlers/terms";
/* import { askSignature } from "../handlers/signature"; */
import { askCountry, askDocumentType, askDocumentPhoto, askSelfie } from "../handlers/identity";
/* import { sendS3DocumentToUser } from "../../services/s3FileRequest"; */
import { resetSession } from "../../services/sessionManager";

import User from "../../models/userSchema";
import documentsUseCase from "../../api/useCases/DocumentsUseCase";

/* const S3_DOC_KEY = `_assets/docs/telegram_test_doc.pdf`; */

export function setupStartCommand() {

    /* Start flow, if the user accepts the terms, the flow continues */
    bot.onText(/\/start(?:\s?(.+))?/, async (msg) => {
        let token: string | undefined = undefined;
        if (msg.text) {
            token = msg.text.substring(6).trim();
            if (token === "") token = undefined;
        }
        const chatId = msg.chat.id;
        /* const phone = match?.[1]; */
        const acceptedTerms = await User.findOne({ userId: msg.from?.id, termsAccepted: true });
        const userName = msg.from?.first_name

        await resetSession(msg.from?.id);

        if (acceptedTerms) {
            console.log("token: ", token);

            if (token) {
                try {
                    const verifyResult = await documentsUseCase.verifyToken({ token });
                    console.log("verifyResult completo:", verifyResult);

                    if (verifyResult.data) {
                        const { document, signerId } = verifyResult.data;
                        const signerName = document.participants.find((p) => p.uuid === signerId);
                        const participantName = signerName?.first_name ?? "";
                        console.log("signerName: ", signerName);
                        console.log("participantName: ", participantName);
                        console.log("documentKey: ", document.metadata.s3Key);
                        console.log("documentUrl: ", document.metadata.url);
                        console.log("documentName: ", document.filename);

                        await User.findOneAndUpdate(
                            { userId: msg.from?.id },
                            {
                                documentKey: document.metadata.s3Key,
                                documentUrl: document.metadata.url,
                                documentName: document.filename,
                                participantName: participantName,
                                token: token,
                                signerId: signerId,
                            },
                            { upsert: true }
                        );
                    }
                } catch (err) {
                    console.error("Error actualizando documento:", err);
                }
            }

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
                    /* await bot.sendMessage(chatId, "Este será el documento que vas a firmar:");
                    await sendS3DocumentToUser(chatId, S3_DOC_KEY, "documento.pdf"); */
                    const documentName = user.documentName || "Documento";
                    const documentUrl = user.documentUrl;
                    const docToken = user.token;
                    const docLink = `https://dev-guest-sign.adamoservices.co/documents?data=${encodeURIComponent(docToken)}`;
                    await bot.sendMessage(chatId, `Este será el documento que vas a firmar: *${documentName}*\n\nfirmalo aquí: [Ver documento](${docLink})`,
                        { parse_mode: "Markdown" }
                    );

                    if (documentUrl) {
                        await bot.sendDocument(chatId, documentUrl, {}, { filename: documentName });
                    }
                    /* await bot.sendMessage(chatId, "Tienes un documento pendiente por firmar", {
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "🔗 Mostrar documento a firmar", callback_data: `mostrar_documento_${token}` }
                                ]
                            ]
                        }
                    }); */
                }, 1000);

            }

            return;
        }


        /* if (phone) {
            await User.findOneAndUpdate(
                { userId: msg.from?.id },
                { phoneNumber: phone, userName: msg.from?.username, userId: msg.from?.id },
                { upsert: true }
            );
        } */

        sendPrivacyPolicy(chatId, msg.from?.first_name || msg.from?.username);
    });
}

bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;
    const token = data.replace('mostrar_documento_', '');

    if (data.startsWith('mostrar_documento_')) {
        const user = await User.findOne({ userId: callbackQuery.from.id });
        if (user && user.documentUrl) {
            const documentName = user.documentName || "Documento";
            const documentUrl = user.documentUrl;
            const docLink = `https://dev-guest-sign.adamoservices.co/documents?data=${encodeURIComponent(token)}`;
            await bot.sendMessage(chatId, `Este será el documento que vas a firmar: *${documentName}*\n\nfirmalo aquí: [Ver documento](${docLink})`,
                { parse_mode: "Markdown" }
            );

            if (documentUrl) {
                await bot.sendDocument(chatId, documentUrl, {}, { filename: documentName });
            }
        } else {
            await bot.sendMessage(chatId, "No se encontró el documento para firmar.");
        }
        await bot.answerCallbackQuery(callbackQuery.id);
    }
});