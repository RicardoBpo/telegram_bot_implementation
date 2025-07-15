import { bot } from "../index";
/* import { askSignature } from "./signature"; */
import { uploadTelegramFileToS3 } from "../../services/s3FileRequest";
/* import { sendS3DocumentToUser } from "../../services/s3FileRequest"; */
import { updateUserActivity, isSessionBlocked } from "../../services/sessionManager";
import { sendPendingDocumentMessage } from "./document";

import i18next from "i18next";
import documentsUseCase from "../../api/useCases/DocumentsUseCase";
import User from "../../models/userSchema";


const countries = ["🇲🇽 México", "🇨🇴 Colombia", "🇦🇷 Argentina", "🇧🇷 Brasil"];


/* const S3_DOC_KEY = `_assets/docs/telegram_test_doc.pdf`; */

export function askCountry(chatId: number) {
    bot.sendMessage(chatId, i18next.t("identity_step.select_country"), {
        reply_markup: {
            keyboard: [countries],
            one_time_keyboard: true,
            resize_keyboard: true
        }
    });
}

export function askDocumentType(chatId: number) {
    const documents = [
        i18next.t("identity_step.documents.cc"),
        i18next.t("identity_step.documents.ce"),
        i18next.t("identity_step.documents.passport"),
        i18next.t("identity_step.documents.license"),
    ];
    bot.sendMessage(chatId, i18next.t("identity_step.select_document_type"), {
        reply_markup: {
            keyboard: documents.map(doc => [doc]),
            one_time_keyboard: true,
            resize_keyboard: true
        }
    });
}

export function askDocumentPhoto(chatId: number) {
    bot.sendMessage(chatId, i18next.t("identity_step.upload_document_photo"));
}
export function askSelfie(chatId: number) {
    bot.sendMessage(chatId, i18next.t("identity_step.upload_selfie"));
}

/* function askVideo(chatId: number) {
    bot.sendMessage(chatId, "Por último, sube un video corto mostrando tu rostro.");
} */
/* export function askFaceRecognition(chatId: number) {
    bot.sendMessage(chatId, `chatId, Ahora que seleccionaste, por favor sube una foto de tu rostro o pulsa 'Rechazar'.`, {
        reply_markup: {
            keyboard: [documents],
            one_time_keyboard: true,
            resize_keyboard: true
        }
    });
} */

export function setupIdentityHandler() {
    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;
        const user = await User.findOne({ userId });
        const documents = [
            i18next.t("identity_step.documents.cc"),
            i18next.t("identity_step.documents.ce"),
            i18next.t("identity_step.documents.passport"),
            i18next.t("identity_step.documents.license"),
        ];

        //Detect user language
        const lang = msg.from?.language_code?.split('-')[0] || 'es';
        await i18next.changeLanguage(lang);

        if (isSessionBlocked(user)) {
            bot.sendMessage(chatId, i18next.t("identity_step.session_closed"));
            return;
        }

        // Update user activity
        await updateUserActivity(userId, chatId);

        if (!user?.termsAccepted) return;
        // Country selection
        if (user?.identityStep === "askCountry" && countries.includes(msg.text || "")) {
            await User.findOneAndUpdate(
                { userId },
                { country: msg.text, identityStep: "documentType" },
                { upsert: true }
            );
            bot.sendMessage(chatId, i18next.t("identity_step.country_selected", { country: msg.text }), {
                reply_markup: { remove_keyboard: true }
            });
            askDocumentType(chatId);
            return;
        }

        // Document type selection
        if (user?.identityStep === "documentType" && documents.includes(msg.text || "")) {
            await User.findOneAndUpdate(
                { userId },
                { documentType: msg.text, identityStep: "documentPhoto" },
                { upsert: true }
            );
            askDocumentPhoto(chatId);
            return;
        }

        // Document photo
        if (user?.identityStep === "documentPhoto") {
            if (!msg.photo) {
                bot.sendMessage(chatId, i18next.t('identity_step.invalid_document_photo'), { parse_mode: "Markdown" });
                return;
            }
            const photo = msg.photo[msg.photo.length - 1];
            const s3Key = `identity/${userId}/document_${Date.now()}.jpg`;
            await uploadTelegramFileToS3(photo.file_id, s3Key);
            bot.sendMessage(chatId, i18next.t("identity_step.document_uploaded"));
            await User.findOneAndUpdate(
                { userId },
                { identityStep: "selfie" }
            );
            askSelfie(chatId);
            return;
        }

        // selfie
        if (user?.identityStep === "selfie") {
            if (!msg.photo) {
                bot.sendMessage(chatId, i18next.t("identity_step.invalid_selfie"), { parse_mode: "Markdown" });
                return;
            }
            const photo = msg.photo[msg.photo.length - 1];
            const s3Key = `identity/${userId}/selfie_${Date.now()}.jpg`;
            await uploadTelegramFileToS3(photo.file_id, s3Key);
            bot.sendMessage(chatId, i18next.t("identity_step.selfie_uploaded"));

            setTimeout(() => {
                bot.sendMessage(chatId, i18next.t("identity_step.identity_verified"));
            }, 1000);

            await User.findOneAndUpdate(
                { userId },
                {
                    identityStep: "done",
                    faceRecognition: {
                        fileId: photo.file_id,
                        fileName: "selfie.jpg",
                        verified: false
                    }
                }
            );

            const updatedUser = await User.findOne({ userId });
            const token = updatedUser?.token;
            console.log("Token:", token);

            if (token) {
                try {
                    const verifyResult = await documentsUseCase.verifyToken({ token });
                    if (verifyResult.data) {
                        const { document, signerId } = verifyResult.data;
                        const signer = document.participants.find(p => p.uuid === signerId);
                        const participantName = signer?.first_name ?? '';
                        await User.findOneAndUpdate(
                            { userId },
                            {
                                documentKey: document.metadata.s3Key,
                                documentUrl: document.metadata.url,
                                documentName: document.filename,
                                participantName,
                                token,
                                signerId,
                            }
                        );
                    }
                } catch (err) {
                    console.error("Error al verificar token:", err);
                }
            }

            setTimeout(async () => {
                const updatedUser = await User.findOne({ userId });
                await sendPendingDocumentMessage(chatId, updatedUser);
                return;
            }, 1000);

            /* askVideo(chatId); 
            return;*/
        }

        // Ask for video
        /* if (user?.identityStep === "video") {
            if (!msg.video) {
                bot.sendMessage(chatId, "Por favor, sube un *video* mostrando tu rostro, no texto.", { parse_mode: "Markdown" });
                return;
            }
            const video = msg.video;
            const s3Key = `identity/${userId}/video_${Date.now()}.mp4`;
            await uploadTelegramFileToS3(video.file_id, s3Key);
            bot.sendMessage(chatId, "Video subido correctamente. ¡Identidad validada!");
            await User.findOneAndUpdate(
                { userId },
                { identityStep: "done" }
            );
            askSignature(chatId);
            return;
        } */

    });
}
