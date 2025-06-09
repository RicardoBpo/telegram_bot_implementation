
/* Listen Msg's
const bot = new TelegramBot(TOKEN, { polling: true });

    bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || "";

    console.log(`Message from: ${msg.from?.username}: ${text}`);

    // Reply with the text
    bot.sendMessage(chatId, `I said: ${text}`);
    
}); */
/* 
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "¡Hola! Soy tu bot en TypeScript 🚀");
});
 */


import "./server";
import { setupStartCommand } from "./bot/commands/start";
import { setupFormFlow } from "./bot/handlers/forms";
import { setupPrivacyButtons } from "./bot/handlers/callbacks/requestResponse";
import { setupDocumentHandler } from "./bot/handlers/documents";

// Initialize bot
setupStartCommand();
setupFormFlow();
setupPrivacyButtons();
setupDocumentHandler();
