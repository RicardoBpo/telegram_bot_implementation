import { bot } from ".."
import { sendPrivacyPolicy } from "../commands/start";

const userStates = new Map<number, string>();

export function setupFormFlow() {
    bot.onText(/\/formulario(?:\s(.+))?/, (msg) => {
       /*  const chatId = msg.chat.id;
        const payload = msg.text.split(' ')[1];
        bot.sendMessage(chatId, `¡Hola! Iniciaste la verificación con el número: ${payload}`); */
        bot.sendMessage(msg.chat.id, "¿Cuál es tu nombre?");
        userStates.set(msg.chat.id, "esperando_nombre");
    });

    bot.on("message", (msg) => {
        const chatId = msg.chat.id;
        const state = userStates.get(chatId);

        if (state === "esperando_nombre") {
            const nombre = msg.text;
            bot.sendMessage(chatId, `¡Perfecto, ${nombre}! ✅\n`);
            sendPrivacyPolicy(msg.chat.id);
            return;
        }
    });

    /* bot.on("message", (msg) => {
        const state = userStates.get(msg.chat.id);
        const chatId = msg.chat.id;
        const payload = msg.text.split(' ')[1];
        bot.sendMessage(chatId, `¡Hola! Iniciaste la verificación con el número: ${payload}`);
        bot.sendMessage(msg.chat.id, "¿Cuál es tu nombre?");
        userStates.set(msg.chat.id, "esperando_nombre");
        if (state === "esperando_nombre") {
            bot.sendMessage(msg.chat.id, `Hola ${msg.text}, formulario completado ✅`);
            userStates.delete(msg.chat.id);
            sendPrivacyPolicy(msg.chat.id);
        }

    }); */
}