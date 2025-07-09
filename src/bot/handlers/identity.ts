import { bot } from "../index";
/* import { askSignature } from "./signature"; */
import { uploadTelegramFileToS3 } from "../../services/s3FileRequest";
/* import { sendS3DocumentToUser } from "../../services/s3FileRequest"; */
import { updateUserActivity, isSessionBlocked } from "../../services/sessionManager";
import { sendPendingDocumentMessage } from "./document";
import User from "../../models/userSchema";


const countries = ["🇲🇽 México", "🇨🇴 Colombia", "🇦🇷 Argentina", "🇧🇷 Brasil"];
const documents = [
    "Cedula de Ciudadanía",
    "Cédula de Extranjería",
    "Pasaporte",
    "Licencia de Conducir"
];

/* const S3_DOC_KEY = `_assets/docs/telegram_test_doc.pdf`; */

export function askCountry(chatId: number) {
    bot.sendMessage(chatId, "Primero me gustaría saber en dónde vives!:", {
        reply_markup: {
            keyboard: [countries],
            one_time_keyboard: true,
            resize_keyboard: true
        }
    });
}

export function askDocumentType(chatId: number) {
    bot.sendMessage(chatId, "Por favor, selecciona el tipo de documento que deseas verificar:", {
        reply_markup: {
            keyboard: documents.map(doc => [doc]),
            one_time_keyboard: true,
            resize_keyboard: true
        }
    });
}

export function askDocumentPhoto(chatId: number) {
    bot.sendMessage(chatId, "Por favor, sube una foto de tu documento de identidad.");
}

export function askSelfie(chatId: number) {
    bot.sendMessage(chatId, "Ahora sube una selfie (foto de tu rostro).");
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

        if (isSessionBlocked(user)) {
            bot.sendMessage(chatId, "Tu sesión fue cerrada por inactividad. Por favor, inicia el proceso de nuevo con /start.");
            return;
        }

        // Update user activity
        await updateUserActivity(userId, chatId);

        if (!user?.termsAccepted) return;
        // Country selection
        if (user?.identityStep === undefined && countries.includes(msg.text || "")) {
            await User.findOneAndUpdate(
                { userId },
                { country: msg.text, identityStep: "documentType" },
                { upsert: true }
            );
            bot.sendMessage(chatId, `País seleccionado: ${msg.text}.`, {
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
                bot.sendMessage(chatId, "Por favor, sube una *foto* de tu documento, no texto.", { parse_mode: "Markdown" });
                return;
            }
            const photo = msg.photo[msg.photo.length - 1];
            const s3Key = `identity/${userId}/document_${Date.now()}.jpg`;
            await uploadTelegramFileToS3(photo.file_id, s3Key);
            bot.sendMessage(chatId, "Documento subido correctamente.");
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
                bot.sendMessage(chatId, "Por favor, sube una *selfie* (foto), no texto.", { parse_mode: "Markdown" });
                return;
            }
            const photo = msg.photo[msg.photo.length - 1];
            const s3Key = `identity/${userId}/selfie_${Date.now()}.jpg`;
            await uploadTelegramFileToS3(photo.file_id, s3Key);
            bot.sendMessage(chatId, "Selfie subida correctamente.");
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
            bot.sendMessage(chatId, "¡Identidad validada! Ahora puedes firmar documentos.");
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
