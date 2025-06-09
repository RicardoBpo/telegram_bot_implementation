import { bot } from "../index"
//import { sendRequestMessage } from "../../utils/sendRequestMessage";

export function sendPrivacyPolicy(chatId: number) {
    const politicas = `👋 ¡Hola! Bienvenido al bot.\n\n🔒 *Políticas de Privacidad*\n\nAl continuar, aceptas nuestras [políticas de privacidad](https://adamo-resources.s3.us-east-2.amazonaws.com/public/ADAMO_ID.pdf). ¿Deseas continuar?`;
    bot.sendMessage(chatId, politicas, {
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
    bot.onText(/\/start/, (msg) => {
        sendPrivacyPolicy(msg.chat.id);
    });
}

