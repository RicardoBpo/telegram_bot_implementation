import { bot } from "../bot/index";

export const sendRequestMessage = (chatId: number, requesterName: string) => {
    bot.sendMessage(chatId, `¿Aceptar o rechazar la solicitud de ${requesterName}?`, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "✅ Aceptar", callback_data: `accept_${requesterName}` },
                    { text: "❌ Rechazar", callback_data: `reject_${requesterName}` },
                ],
            ],
        },
    });
};