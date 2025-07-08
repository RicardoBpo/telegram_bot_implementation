import { bot } from "../index";
import { sendPrivacyPolicy } from "../handlers/terms";
/* import { askSignature } from "../handlers/signature"; */
/* import { askCountry, askDocumentType, askDocumentPhoto, askSelfie } from "../handlers/identity"; */
/* import { sendS3DocumentToUser } from "../../services/s3FileRequest"; */
import { resetSession } from "../../services/sessionManager";

import User from "../../models/userSchema";
import documentsUseCase from "../../api/useCases/DocumentsUseCase";

/* const S3_DOC_KEY = `_assets/docs/telegram_test_doc.pdf`; */

export function setupStartCommand() {
    bot.onText(/\/start(?:\s(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const token = match?.[1];
        const userName = msg.from?.first_name;

        await resetSession(msg.from?.id);

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