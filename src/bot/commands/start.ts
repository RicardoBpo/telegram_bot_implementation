import { bot } from "../index";
import { sendPrivacyPolicy } from "../handlers/terms";
import { askCountry, askDocumentType, askDocumentPhoto, askSelfie } from "../handlers/identity";
import { resetSession } from "../../services/sessionManager";
import { sendPendingDocumentMessage } from "../handlers/document";

import User from "../../models/userSchema";
import documentsUseCase from "../../api/useCases/DocumentsUseCase";

export function setupStartCommand() {
    // Manejo del comando /start con payload JWT u otros datos
    bot.onText(/^\/start(?:\s+(.+))?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        const phone = match?.[1];
        const userName = msg.from?.first_name || msg.from?.username || '';
        const acceptedTerms = await User.findOne({ userId: msg.from?.id, termsAccepted: true });
        let user = phone ? await User.findOne({ phoneNumber: phone }) : null;
        const token = user.token;

        console.log("Telefono recibido:", phone);

        if (!phone || !token) {
            bot.sendMessage(
                chatId,
                `¡Hola ${userName}! Parece que no tienes un número de teléfono o docuemnto asociado para iniciar el proceso. \n\nInicia el proceso desde el link que te ha llegado a tu telefono.`
            );
            return;
        }

        
        // Reiniciar sesión del usuario
        await resetSession(msg.from?.id);

        console.log("token: ", token);


        if (acceptedTerms && user.phoneNumber) {
            await User.findOneAndUpdate({
                userId: msg.from?.id
            }, {
                token,
                phoneNumber: phone,
            })
            await bot.sendMessage(chatId, `¡Hola ${userName}! Continúa con el proceso.`);

            user = await User.findOne({ userId: msg.from?.id /* phoneNumber: phone */ });
            // Continuar flujo según el paso guardado
            switch (user?.identityStep) {
                case "askCountry":
                    setTimeout(() => askCountry(chatId), 1000);
                    break;
                case "documentType":
                    setTimeout(() => askDocumentType(chatId), 1000);
                    break;
                case "documentPhoto":
                    setTimeout(() => askDocumentPhoto(chatId), 1000);
                    break;
                case "selfie":
                    setTimeout(() => askSelfie(chatId), 1000);
                    break;
                case "done":
                    console.log("Token:", token);

                    if (token) {
                        try {
                            const verifyResult = await documentsUseCase.verifyToken({ token });
                            if (verifyResult.data) {
                                const { document, signerId } = verifyResult.data;
                                const signer = document.participants.find(p => p.uuid === signerId);
                                const participantName = signer?.first_name ?? '';
                                const identityStatus = user.identityStep;
                                // Update user with document details
                                await User.findOneAndUpdate(
                                    { userId: msg.from?.id },
                                    {
                                        userId: msg.from?.id,
                                        userName,
                                        phoneNumber: phone,
                                        documentKey: document.metadata.s3Key,
                                        documentUrl: document.metadata.url,
                                        documentName: document.filename,
                                        identityStep: identityStatus,
                                        participantName,
                                        token,
                                        signerId,
                                    },
                                    { upsert: true }
                                );

                            }
                            console.log("Usuario encontrado:", user);

                        } catch (err) {
                            console.error("Error al verificar token:", err);
                        }
                    }
                    setTimeout(async () => await sendPendingDocumentMessage(chatId, user), 1000);
                    break;
            }
            return;
        } else if (!(user.phoneNumber)) {
            bot.sendMessage(
                chatId,
                `¡Hola ${userName}! Parece que no tienes un número de teléfono asociado para iniciar el proceso.
                Inicia el proceso desde el link que te ha llegado a tu telefono.`
            );
            return;
        }

        // Enviar términos y condiciones
        sendPrivacyPolicy(chatId, userName);
    });
}

// Manejador de callback queries
bot.on('callback_query', async callbackQuery => {
    const msg = callbackQuery.message!;
    const chatId = msg.chat.id;
    const data = callbackQuery.data || '';

    if (data.startsWith('mostrar_documento_')) {
        const userId = data.replace('mostrar_documento_', '');
        const user = await User.findOne({ userId: parseInt(userId) });

        if (user?.token && user.documentUrl) {
            const docLink = `https://dev-guest-sign.adamoservices.co/documents?data=${encodeURIComponent(user.token)}`;
            await bot.sendMessage(chatId,
                `Documento: *${user.documentName || 'Documento'}*\nIngresa al siguiente link para firmar el docuemnto\n\n[Firma aquí](${docLink})`,
                { parse_mode: 'Markdown' }
            );
            await bot.sendDocument(chatId, user.documentUrl, {}, { filename: user.documentName });
        } else {
            await bot.sendMessage(chatId, 'No se encontró el documento para firmar.');
        }
        await bot.answerCallbackQuery(callbackQuery.id);
    }
});
