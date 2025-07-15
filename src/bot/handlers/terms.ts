import { bot } from "../index";
/* import { setupIdentityHandler } from "./identity"; */
import { askCountry } from "./identity";
import User from "../../models/userSchema";

/* 
    FLOW IMPLEMENTED ON start.ts TO HANDLE TOKEN VERIFICATION
    THE setupTermsHandler is not being called in app.ts
*/
export function sendPrivacyPolicy(chatId: number, userName: string) {
    const policies = `👋 ¡Hola ${userName}! Bienvenido al bot de AdamoSign.\n\n🔒 *Políticas de Privacidad*\n\nAl continuar, aceptas nuestras [políticas de privacidad](https://adamo-resources.s3.us-east-2.amazonaws.com/public/ADAMO_ID.pdf). ¿Deseas continuar?`;
    bot.sendMessage(chatId, policies, {
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

export function setupTermsHandler() {
    bot.on("callback_query", async (query) => {
        const chatId = query.message?.chat.id;
        const messageId = query.message?.message_id;
        const data = query.data;
        const userId = query.from.id;
        const username = query.from.username;

        if (!chatId || !data) return;

        if (data === "privacidad_aceptar") {
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });

            await User.findOneAndUpdate(
                { userId },
                { userName: username, userId, termsAccepted: true },
                { upsert: true }
            );

            setTimeout(() => {
                askCountry(chatId);
            }, 1000);

        } else if (data === "privacidad_rechazar") {
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
            await bot.editMessageText("No puedes continuar sin aceptar las políticas de privacidad.", { chat_id: chatId, message_id: messageId });
            
            const startAgain = "Quieres volver a intentarlo?";
            await bot.sendMessage(chatId, startAgain, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🔄 Volver a intentarlo", callback_data: "volver_a_intentar" }]
                    ]
                }
            });
            
        } else if (data === "volver_a_intentar") {
            sendPrivacyPolicy(chatId, username);
        }; 
        await bot.answerCallbackQuery(query.id);
    });
}