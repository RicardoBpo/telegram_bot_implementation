"use strict";
/* ----Simple connection test----
import express from 'express';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  return console.log(`Running at: ${port}`);
}); */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
require('dotenv').config();
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Listen Msg's
const bot = new node_telegram_bot_api_1.default(TOKEN, { polling: true });
/* bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || "";

    console.log(`Message from: ${msg.from?.username}: ${text}`);

    // Reply with the text
    bot.sendMessage(chatId, `I said: ${text}`);
    
}); */
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "¡Hola! Soy tu bot en TypeScript 🚀");
});
//# sourceMappingURL=app.js.map