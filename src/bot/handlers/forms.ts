import { bot } from ".."
import { sendPrivacyPolicy } from "../commands/start";

const userStates = new Map<number, string>();

export function setupFormFlow() {
    bot.onText(/\/formulario/, (msg) => {
        bot.sendMessage(msg.chat.id, "¿Cuál es tu nombre?");
        userStates.set(msg.chat.id, "esperando_nombre");
    });

    bot.on("message", (msg) => {
        const state = userStates.get(msg.chat.id);

        if (state === "esperando_nombre") {
            bot.sendMessage(msg.chat.id, `Hola ${msg.text}, formulario completado ✅`);
            userStates.delete(msg.chat.id);
            sendPrivacyPolicy(msg.chat.id);
        }

        /* await create.User (state) */
    });
}