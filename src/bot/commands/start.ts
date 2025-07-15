import { bot } from "../index";
import { askCountry, askDocumentType, askDocumentPhoto, askSelfie } from "../handlers/identity";
import { resetSession } from "../../services/sessionManager";
import { sendPendingDocumentMessage } from "../handlers/document";
import User from "../../models/userSchema";
import documentsUseCase from "../../api/useCases/DocumentsUseCase";
import i18next from "i18next";

// Políticas de privacidad

function sendPrivacyPolicy(chatId: number, userName: string) {
    const link = "https://adamo-resources.s3.us-east-2.amazonaws.com/public/ADAMO_ID.pdf";
    const policies = i18next.t('privacy_policy.message', { userName, link });
    bot.sendMessage(chatId, policies, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [
                [
                    { text: i18next.t('privacy_policy.accept_button'), callback_data: "privacidad_aceptar" },
                    { text: i18next.t('privacy_policy.reject_button'), callback_data: "privacidad_rechazar" }
                ]
            ]
        }
    });
}

export function setupStartCommand() {
    // Manejo del comando /start con payload JWT u otros datos
    bot.onText(/^\/start(?:\s+(.+))?$/, async (msg, match) => {

        //Detect user language
        const lang = msg.from?.language_code?.split('-')[0] || 'es';
        await i18next.changeLanguage(lang);

        const chatId = msg.chat.id;
        const payload = match?.[1] || '';
        const userName = msg.from?.first_name || msg.from?.username || '';

        // Detect if is phone (numbers) or token (JWT)
        const isPhone = /^\d{7,15}$/.test(payload);
        const isSignedString = payload === "signed";

        if (isPhone) {
            console.log('Teléfono recibido:', payload);
            let user = await User.findOne({ phoneNumber: payload });
            const token = user?.token;
            if (!user || !token) {
                bot.sendMessage(
                    chatId,
                    i18next.t('no_phone_or_document', { userName }),
                );
                return;
            }
            await User.findOneAndUpdate(
                { userId: msg.from?.id },
                { userName, userId: msg.from?.id, phoneNumber: payload, token },
                { upsert: true }
            );
            await resetSession(msg.from?.id);
            const acceptedTerms = await User.findOne({ userId: msg.from?.id, termsAccepted: true });
            if (!acceptedTerms) {
                sendPrivacyPolicy(chatId, userName);
                return;
            }

            if (token) {
                try {
                    const verifyResult = await documentsUseCase.verifyToken({ token });
                    if (verifyResult.data) {
                        const { document, signerId } = verifyResult.data;
                        const signer = document.participants.find(p => p.uuid === signerId);
                        const participantName = signer?.first_name ?? '';

                        // Update user with document details
                        await User.findOneAndUpdate(
                            { phoneNumber: payload },
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

            if (user.phoneNumber) {
                await bot.sendMessage(chatId, i18next.t('continue_process', { userName }));
                user = await User.findOne({ userId: msg.from?.id });
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
                    default:
                        sendPendingDocumentMessage(chatId, user);
                }
            }
            return;
        } else if (isSignedString) {
            console.log('param: ', payload);

            const user = await User.findOne({ userId: msg.from?.id });
            const token = user?.token;

            if (!token) {
                await bot.sendMessage(chatId, i18next.t('document_not_found'));
                return;
            }

            try {
                const verifyResult = await documentsUseCase.verifyToken({ token });
                if (verifyResult.data) {
                    const { document } = verifyResult.data;
                    const versions = document.metadata?.versions;
                    const lastVersion = Array.isArray(versions) && versions.length > 0
                        ? versions[versions.length - 1]
                        : null;
                    const signedUrl = lastVersion?.url
                    const documentName = lastVersion?.filename || 'Documento firmado';

                    if (signedUrl) {
                        await bot.sendMessage(chatId, i18next.t('document_signed'));
                        await bot.sendDocument(chatId, signedUrl, {}, { filename: documentName });
                    } else {
                        await bot.sendMessage(chatId, i18next.t('document_not_found'));
                    }
                } else {
                    await bot.sendMessage(chatId, i18next.t('document_not_found'));
                }
            } catch (err) {
                console.error("Error al verificar token para documento firmado:", err);
                await bot.sendMessage(chatId, i18next.t('document_not_found'));
            }
            return;
        } else {
            console.log('Parámetro desconocido recibido en /start:', payload);
            bot.sendMessage(chatId, i18next.t('invalid_link'));
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
        console.log("token: ", token);

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
            await bot.editMessageText(i18next.t('privacy_required'), { chat_id: chatId, message_id: msg.message_id });

            const startAgain = i18next.t('try_again');
            await bot.sendMessage(chatId, startAgain, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: i18next.t('retry_button'), callback_data: "volver_a_intentar" }]
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
                const link = `https://dev-guest-sign.adamoservices.co/documents?data=${encodeURIComponent(userDoc.token)}`;
                const documentName = userDoc.documentName || 'Documento';
                await bot.sendMessage(chatId,
                    i18next.t('document_link_message', { documentName, link }),
                    { parse_mode: 'Markdown' }
                );
                await bot.sendDocument(chatId, userDoc.documentUrl, {}, { filename: userDoc.documentName });

            } else {
                await bot.sendMessage(chatId, i18next.t('document_not_found'));
            }
        }
        await bot.answerCallbackQuery(callbackQuery.id);
    });
}