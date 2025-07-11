import { bot } from "../index";
import { askCountry, askDocumentType, askDocumentPhoto, askSelfie } from "../handlers/identity";
import { resetSession } from "../../services/sessionManager";
import { sendPendingDocumentMessage } from "../handlers/document";
import User from "../../models/userSchema";
import documentsUseCase from "../../api/useCases/DocumentsUseCase";

// Políticas de privacidad
function sendPrivacyPolicy(chatId: number, userName: string) {
    const policies = `👋 ¡Hola ${userName}! Bienvenido al bot de AdamoSign.\n\n🔒 *Políticas de Privacidad*\n\nAl continuar, aceptas nuestras [políticas de privacidad](https://adamo-resources.s3.us-east-2.amazonaws.com/public/ADAMO_ID.pdf). ¿Deseas continuar?`;
    bot.sendMessage(chatId, policies, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "✅ Aceptar", callback_data: "privacidad_aceptar" },
                    { text: "❌ Rechazar", callback_data: "privacidad_rechazar" }
                ]
            ]
        }
    });
}

export function setupStartCommand() {
    // Manejo del comando /start con payload JWT u otros datos
    bot.onText(/^\/start(?:\s+(.+))?$/, async (msg, match) => {
        /* const tokenSigned = match?.[1] || ''; */
        const chatId = msg.chat.id;
        const phone = match?.[1];
        const userName = msg.from?.first_name || msg.from?.username || '';
        let user = phone ? await User.findOne({ phoneNumber: phone }) : null;
        const token = user?.token;

        console.log("Telefono recibido:", phone);

        if (!phone || !token) {
            bot.sendMessage(
                chatId,
                `¡Hola ${userName}! Parece que no tienes un número de teléfono o documento asociado para iniciar el proceso. \n\nInicia el proceso desde el link que te ha llegado a tu telefono.`
            );
            return;
        }

        await User.findOneAndUpdate(
            { userId: msg.from?.id },
            { userName, userId: msg.from?.id, phoneNumber: phone, token },
            { upsert: true }
        );


        // Reiniciar sesión del usuario
        await resetSession(msg.from?.id);

        console.log("token: ", token);

        // Validar términos aceptados
        const acceptedTerms = await User.findOne({ userId: msg.from?.id, termsAccepted: true });

        if (!acceptedTerms) {
            sendPrivacyPolicy(chatId, userName);
            return;
        }

        if (user.phoneNumber) {
            await bot.sendMessage(chatId, `¡Hola ${userName}! Continúa con el proceso.`);

            user = await User.findOne({ userId: msg.from?.id });
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
        } else {
            bot.sendMessage(
                chatId,
                `¡Hola ${userName}! Parece que no tienes un número de teléfono asociado para iniciar el proceso.
                Inicia el proceso desde el link que te ha llegado a tu telefono.`
            );
            return;
        }
    });

    // Manejador de callback queries para términos y documentos
    bot.on('callback_query', async callbackQuery => {
        const msg = callbackQuery.message!;
        const chatId = msg.chat.id;
        const data = callbackQuery.data || '';
        const userId = callbackQuery.from.id;
        const username = callbackQuery.from.username;
        const user = await User.findOne({ userId });
        const token = user?.token;
        console.log("tojen:", token);
        
        // Términos de privacidad
        if (data === "privacidad_aceptar") {
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: msg.message_id });

            await User.findOneAndUpdate(
                { userId },
                { userName: username, userId, termsAccepted: true, token },
                { upsert: true }
            );

            setTimeout(() => {
                askCountry(chatId);
            }, 1000);

        } else if (data === "privacidad_rechazar") {
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: msg.message_id });
            await bot.editMessageText("No puedes continuar sin aceptar las políticas de privacidad.", { chat_id: chatId, message_id: msg.message_id });

            const startAgain = "¿Quieres volver a intentarlo?";
            await bot.sendMessage(chatId, startAgain, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🔄 Volver a intentarlo", callback_data: "volver_a_intentar" }]
                    ]
                }
            });

        } else if (data === "volver_a_intentar") {
            sendPrivacyPolicy(chatId, username);
        }

        // Documentos
        if (data.startsWith('mostrar_documento_')) {
            const userIdDoc = data.replace('mostrar_documento_', '');
            const userDoc = await User.findOne({ userId: parseInt(userIdDoc) });

            if (userDoc?.token && userDoc.documentUrl) {
                const docLink = `https://dev-guest-sign.adamoservices.co/documents?data=${encodeURIComponent(userDoc.token)}`;
                await bot.sendMessage(chatId,
                    `Documento: *${userDoc.documentName || 'Documento'}*\nIngresa al siguiente link para firmar el documento\n\n[Firma aquí](${docLink})`,
                    { parse_mode: 'Markdown' }
                );
                await bot.sendDocument(chatId, userDoc.documentUrl, {}, { filename: userDoc.documentName });
            } else {
                await bot.sendMessage(chatId, 'No se encontró el documento para firmar.');
            }
        }
        await bot.answerCallbackQuery(callbackQuery.id);
    });
}