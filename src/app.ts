
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
import "./server";
import { setupStartCommand } from "./bot/commands/start";
/* import { setupTermsHandler } from "./bot/handlers/terms"; */
import { setupIdentityHandler } from "./bot/handlers/identity";
import { setupSignatureHandler } from "./bot/handlers/signature";
import { setupSignedCommand } from "./bot/commands/signed";
import { initI18n } from "./i18n/config";
import "./i18n/config";

(async () => {
  await initI18n();

  // ...existing code...
  setupStartCommand();
  setupSignedCommand();
  //setupTermsHandler();
  setupIdentityHandler();
  setupSignatureHandler();
})();

