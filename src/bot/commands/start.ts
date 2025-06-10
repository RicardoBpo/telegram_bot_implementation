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
    /* bot.onText(/\/start/, (msg) => {
        sendPrivacyPolicy(msg.chat.id);
    });
*/

 bot.onText(/\/start(?:\s(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const payload = match?.[1];

    if (payload) {
      bot.sendMessage(chatId, `¡Hola! Iniciaste la verificación con el número: ${payload}`);
      bot.sendMessage(chatId, "📋 Formulario de verificación:\n1. ¿Cuál es tu nombre?");
    } else {
      sendPrivacyPolicy(chatId);
    }
  });
}

