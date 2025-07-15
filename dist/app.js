"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
require("./server");
const start_1 = require("./bot/commands/start");
const forms_1 = require("./bot/handlers/forms");
const requestResponse_1 = require("./bot/handlers/callbacks/requestResponse");
const documents_1 = require("./bot/handlers/documents");
// Initialize bot
(0, start_1.setupStartCommand)();
(0, forms_1.setupFormFlow)();
(0, requestResponse_1.setupPrivacyButtons)();
(0, documents_1.setupDocumentHandler)();
//# sourceMappingURL=app.js.map