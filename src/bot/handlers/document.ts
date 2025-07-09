import { bot } from "../index";

export async function sendPendingDocumentMessage(chatId: number, user: any) {
    await bot.sendMessage(chatId, "Tienes un documento pendiente por firmar", {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🔗 Mostrar documento a firmar", callback_data: `mostrar_documento_${user.userId}` }
                ]
            ]
        }
    });
    
}

