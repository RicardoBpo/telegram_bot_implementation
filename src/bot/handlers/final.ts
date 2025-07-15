import { bot } from "../index";
import i18next from "i18next";

export async function finalConfirmation(chatId: number) {
    await bot.sendMessage(chatId, i18next.t("final.message"));
}