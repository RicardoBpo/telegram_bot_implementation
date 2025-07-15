import { bot } from "../index";
import i18next from "i18next";

export async function sendPendingDocumentMessage(chatId: number, user: any) {
    await bot.sendMessage(chatId, i18next.t("show_document_step.pending_doc"), {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: i18next.t("show_document_step.show_doc"), callback_data: `mostrar_documento_${user.userId}` }
                ]
            ]
        }
    });
}

