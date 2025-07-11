"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
require("./server");
const start_1 = require("./bot/commands/start");
/* import { setupTermsHandler } from "./bot/handlers/terms"; */
const identity_1 = require("./bot/handlers/identity");
const signature_1 = require("./bot/handlers/signature");
// Initialize bot
(0, start_1.setupStartCommand)();
//setupTermsHandler();
(0, identity_1.setupIdentityHandler)();
(0, signature_1.setupSignatureHandler)();
//# sourceMappingURL=app.js.map