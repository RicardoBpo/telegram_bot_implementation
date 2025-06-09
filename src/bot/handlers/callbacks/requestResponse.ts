import { bot } from "../../index";
import User from "../../../models/userSchema";

const countries = [
    ["🇲🇽 México", "🇨🇴 Colombia", "🇦🇷 Argentina"]
];

export function setupPrivacyButtons() {
    bot.on("callback_query", async (query) => {
        const chatId = query.message?.chat.id;
        const messageId = query.message?.message_id;
        const data = query.data;
        const userId = query.from.id;
        const username = query.from.username;

        if (!chatId || !data) return;

        if (data === "privacidad_aceptar") {
            // Elimina los botones y muestra animación
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
            await bot.editMessageText("Procesando... ⏳", { chat_id: chatId, message_id: messageId });

            // Guarda aceptación en la BD
            await User.findOneAndUpdate(
                { userName: username },
                { userName: username, userId },
                { upsert: true, new: true }
            );

            // Espera un segundo y muestra el menú de países
            setTimeout(() => {
                bot.sendMessage(chatId, "Selecciona tu país:", {
                    reply_markup: {
                        keyboard: countries,
                        one_time_keyboard: true,
                        resize_keyboard: true
                    }
                });
            }, 1000);

        } else if (data === "privacidad_rechazar") {
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
            await bot.editMessageText("No puedes continuar sin aceptar las políticas de privacidad.", { chat_id: chatId, message_id: messageId });
        }
        await bot.answerCallbackQuery(query.id);
    });

    // Maneja la selección de país
    bot.on("message", async (msg) => {
        const paises = ["🇲🇽 México", "🇨🇴 Colombia", "🇦🇷 Argentina"];
        if (paises.includes(msg.text || "")) {
            await User.findOneAndUpdate(
                { userId: msg.from?.id },
                { country: msg.text },
                { upsert: true }
            );
            await bot.sendMessage(msg.chat.id, `País seleccionado: ${msg.text}. Ahora puedes subir tu firma.`, {
                reply_markup: { remove_keyboard: true }
            });
        }
    });
}
/* export function setupPrivacyButtons() {
    bot.on("callback_query", async (query) => {
        const chatId = query.message?.chat.id;
        const data = query.data;

        if (!chatId || !data) return;

        if (data === "privacidad_aceptar") {
            await bot.sendMessage(chatId, "Gracias por aceptar. Por favor, sube tus documentos en PDF.");
        } else if (data === "privacidad_rechazar") {
            await bot.sendMessage(chatId, "No puedes continuar sin aceptar las políticas de privacidad.");
        }
        await bot.answerCallbackQuery(query.id);
    });
} */