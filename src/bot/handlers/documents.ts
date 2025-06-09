import { bot } from "../index";
import Document from "../../models/documentsSchema"

export function setupDocumentHandler() {
    bot.on("photo", async (msg) => {
        const photo = msg.photo?.[msg.photo.length - 1];
        if (!photo) return "mensaje";

        await Document.create({
            userId: msg.from?.id,
            fileId: photo.file_id,
            fileName: "Firma"
        });

        bot.sendMessage(msg.chat.id, "¡Imagen recibida! 🎉 Gracias, el flujo ha terminado.");
    });
}