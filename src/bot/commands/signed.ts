import { bot } from "../index";
import User from "../../models/userSchema";
import i18next from "i18next";

export function setupSignedCommand() {
    bot.onText(/^\/signed(?:\s+(.+))?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        const token = match?.[1];
        console.log(`/signed command received with token: ${token}`);

        if (!token) {
            bot.sendMessage(chatId, i18next.t("signed_command.missing_token"));
            return;
        }

        const user = await User.findOne({ token });

        if (!user) {
            bot.sendMessage(chatId, i18next.t("signed_command.user_not_found"));
            return;
        }

        user.identityStep = "signed";
        user.lastActivity = new Date();
        user.sessionAuditLog.push({ event: 'signed', timestamp: new Date() });
        await user.save();

        await bot.sendMessage(
            chatId,
            i18next.t("signature_step.document_signed")
        );
    });
}