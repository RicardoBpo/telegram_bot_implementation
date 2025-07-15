"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/*Listen Msg's
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
const signed_1 = require("./bot/commands/signed");
const config_1 = require("./i18n/config");
require("./i18n/config");
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, config_1.initI18n)();
    // ...existing code...
    (0, start_1.setupStartCommand)();
    (0, signed_1.setupSignedCommand)();
    //setupTermsHandler();
    (0, identity_1.setupIdentityHandler)();
    (0, signature_1.setupSignatureHandler)();
}))();
//# sourceMappingURL=app.js.map