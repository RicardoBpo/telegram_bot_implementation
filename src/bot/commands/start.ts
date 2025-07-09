import { bot } from "../index";
import { sendPrivacyPolicy } from "../handlers/terms";
/* import { askSignature } from "../handlers/signature"; */
/* import { askCountry, askDocumentType, askDocumentPhoto, askSelfie } from "../handlers/identity"; */
/* import { sendS3DocumentToUser } from "../../services/s3FileRequest"; */
import { resetSession } from "../../services/sessionManager";
import { sendPendingDocumentMessage } from "../handlers/document";

import User from "../../models/userSchema";
import documentsUseCase from "../../api/useCases/DocumentsUseCase";

/* const S3_DOC_KEY = `_assets/docs/telegram_test_doc.pdf`; */

export function setupStartCommand() {
    bot.onText(/\/start(?:\s?(.+))?/, async (msg, match) => {
        const param = match?.[1];
        console.log("Param recibido:", param);
        let phone: string | undefined;
        let token: string | undefined;
        if (msg.text?.startsWith('/start')) {
            const text = msg.text;
            const params = text.substring(6).trim(); //Delete '/start'

            if (params) {
                const parts = params.split('_');
                if (parts.length === 2) {
                    phone = decodeURIComponent(parts[0]);
                    token = decodeURIComponent(parts[1]);
                } else {
                    token = params;
                }
            }
        }
        const chatId = msg.chat.id;
        /* const phone = match?.[1]; */
        const acceptedTerms = await User.findOne({ userId: msg.from?.id, termsAccepted: true });
        const userName = msg.from?.first_name
        const token = match?.[1];
        const userName = msg.from?.first_name;

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
                    await sendPendingDocumentMessage(chatId, user);
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
        // Verifica si ya aceptó términos
        const acceptedTerms = await User.findOne({ userId: msg.from?.id, termsAccepted: true });

        if (!acceptedTerms) {
            // Envía términos y condiciones
            await sendPrivacyPolicy(chatId, userName || msg.from?.username);
            return;
        }

        // Si ya aceptó términos, procesa el documento
        if (token) {
            try {
                const verifyResult = await documentsUseCase.verifyToken({ token });
                if (verifyResult.data) {
                    const { document, signerId } = verifyResult.data;
                    const signerName = document.participants.find((p) => p.uuid === signerId);
                    const participantName = signerName?.first_name ?? "";
                    const documentStatus = signerName?.status || "pending"; 
                    console.log("Document status: ", documentStatus);
                    
                    await User.findOneAndUpdate(
                        { userId: msg.from?.id },
                        {
                            documentKey: document.metadata.s3Key,
                            documentUrl: document.metadata.url,
                            documentName: document.filename,
                            documentStatus: document.participants.find((p) => p.status),
                            participantName: participantName,
                            token: token,
                            signerId: signerId,
                        },
                        { upsert: true }
                    );
                    

                    // Envía el documento y el botón de firmar
                    const docLink = `https://dev-guest-sign.adamoservices.co/documents?data=${encodeURIComponent(token)}`;
                    await bot.sendMessage(
                        chatId,
                        `¡Hola ${participantName}! \n\nEste será el documento que vas a firmar: *${document.filename}*\n\nFírmalo aquí: [Ver documento](${docLink})`,
                        { parse_mode: "Markdown" }
                    );

                    if (document.metadata.url) {
                        await bot.sendDocument(chatId, document.metadata.url, {}, { filename: document.filename });
                    }
                }
            } catch (err) {
                console.error("Error actualizando documento:", err);
                await bot.sendMessage(chatId, "Hubo un error obteniendo el documento.");
            }
        } else {
            await bot.sendMessage(chatId, "Por favor, ingresa usando el enlace con tu token.");
        }
    });

}

bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;

    if (data.startsWith('mostrar_documento_')) {
        const userId = data.replace('mostrar_documento_', '');
        const user = await User.findOne({ userId: parseInt(userId) });

        if (user && user.token && user.documentUrl) {
            const token = user.token;
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