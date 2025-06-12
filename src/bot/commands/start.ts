import { bot } from "../index";
import { sendPrivacyPolicy } from "../handlers/terms";
import User from "../../models/userSchema";

const usersWithTerms = new Set<number>();

export function setupStartCommand() {
    
    /* Start flow, if the user accepts the terms, the flow continues */
    bot.onText(/\/start(?:\s(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const phone = match?.[1];
        const acceptedTerms = await User.findOne({ userId: msg.from?.id, termsAccepted: true });

        if (usersWithTerms.has(chatId) && acceptedTerms) {
            bot.sendMessage(chatId, "Ya aceptaste los términos. Continúa con el proceso.");
            return;
        }

        // Save the user to the set of users who have accepted terms
        if (phone) {
            await User.findOneAndUpdate(
                { userId: msg.from?.id },
                { phoneNumber: phone, userName: msg.from?.username, userId: msg.from?.id },
                { upsert: true }
            );
        }

        sendPrivacyPolicy(chatId, msg.from?.first_name || msg.from?.username);
    });
}