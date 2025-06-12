import { bot } from "../index";
import User from "../../models/userSchema";
import { askSignature } from "./signature";

const countries = ["🇲🇽 México", "🇨🇴 Colombia", "🇦🇷 Argentina", "🇧🇷 Brasil"];
const userStates = new Map<number, string>();

export function askIdentity(chatId: number) {
    bot.sendMessage(chatId, "¿Cuál es tu nombre completo?");
    userStates.set(chatId, "esperando_nombre");
}

export function setupIdentityHandler() {
    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        const state = userStates.get(chatId);

        if (state === "esperando_nombre") {
            await User.findOneAndUpdate(
                { userId: msg.from?.id },
                { userName: msg.text },
                { upsert: true }
            );
            bot.sendMessage(chatId, "Selecciona tu país:", {
                reply_markup: {
                    keyboard: [countries],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            });
            userStates.set(chatId, "esperando_pais");
            return;
        }

        if (state === "esperando_pais" && countries.includes(msg.text || "")) {
            await User.findOneAndUpdate(
                { userId: msg.from?.id },
                { country: msg.text },
                { upsert: true }
            );
            bot.sendMessage(chatId, `País seleccionado: ${msg.text}. Ahora puedes subir tu firma o rechazar.`, {
                reply_markup: { remove_keyboard: true }
            });
            userStates.delete(chatId);
            askSignature(chatId);
        }
    });
}