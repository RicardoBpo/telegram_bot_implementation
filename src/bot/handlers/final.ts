import { bot } from "../index";
import { askSignature } from "./signature";

export function finalConfirmation(chatId: number, accepted: boolean) {
    if (accepted) {
        bot.sendMessage(chatId, "¡Firma recibida! 🎉 El flujo ha terminado exitosamente.");
    } else {
        bot.sendMessage(chatId, "Has rechazado el proceso. No has firmado ningún documento.", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔄 Reiniciar y subir archivo", callback_data: "reiniciar_firma" }]
                ]
            }
        });
    }
}

export function setupFinalHandler() {
    bot.on("callback_query", async (query) => {
        if (query.data === "reiniciar_firma") {
            const chatId = query.message?.chat.id;
            if (chatId) {
                askSignature(chatId);
            }
            await bot.answerCallbackQuery(query.id);
        }
    });
}