import { bot } from "../index";

export async function finalConfirmation(chatId: number) {
    await bot.sendMessage(chatId, "¡Proceso finalizado! Gracias por usar AdamoSign. Si necesitas algo más, escribe /start.");
}