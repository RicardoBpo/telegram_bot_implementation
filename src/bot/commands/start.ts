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
        console.log("Telefono recibido:", phone);

        // Reiniciar sesión del usuario
        await resetSession(msg.from?.id);

        // Verificar si ya aceptó términos
        const acceptedTerms = await User.findOne({ userId: msg.from?.id, termsAccepted: true });
        const userName = msg.from?.first_name || msg.from?.username || '';
        let user = phone ? await User.findOne({ phoneNumber: phone }) : null;
        console.log("Usuario encontrado:", user);
        
        if ( acceptedTerms && user.phoneNumber ) {
            const token = user.token;
            if (token) {
                try {
                    const verifyResult = await documentsUseCase.verifyToken({ token });
                    if (verifyResult.data) {
                        const { document, signerId } = verifyResult.data;
                        const signer = document.participants.find(p => p.uuid === signerId);
                        const participantName = signer?.first_name ?? '';

                        // Update user with document details
                        await User.findOneAndUpdate(
                            { phoneNumber: phone },
                            {
                                userId: msg.from?.id,
                                userName,
                                documentKey: document.metadata.s3Key,
                                documentUrl: document.metadata.url,
                                documentName: document.filename,
                                participantName,
                                token,
                                signerId,
                            },
                            { upsert: true }
                        );

                    }
                } catch (err) {
                    console.error("Error al verificar token:", err);
                }
            }

            await bot.sendMessage(chatId, `¡Hola ${userName}! Continúa con el proceso.`);

            user = await User.findOne({ userId: msg.from?.id /* phoneNumber: phone */ });
            // Continuar flujo según el paso guardado
            switch (user?.identityStep) {
                case undefined:
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
                    setTimeout(async () => await sendPendingDocumentMessage(chatId, user), 1000);
                    break;
            }
            return;
        }

        // Si viene número de teléfono en payload
        if (phone) {
            await User.findOneAndUpdate(
                { userId: msg.from?.id },
                { phoneNumber: phone, userName, userId: msg.from?.id },
                { upsert: true }
            );
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
                `Documento: *${user.documentName || 'Documento'}*\n[Firma aquí](${docLink})`,
                { parse_mode: 'Markdown' }
            );
            await bot.sendDocument(chatId, user.documentUrl, {}, { filename: user.documentName });
        } else {
            await bot.sendMessage(chatId, 'No se encontró el documento para firmar.');
        }
        await bot.answerCallbackQuery(callbackQuery.id);
    }
});
