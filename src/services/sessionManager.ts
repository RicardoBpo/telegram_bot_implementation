import User from "../models/userSchema";
import { bot } from "../bot";
import i18next from "i18next";

type TimerRefs = {
    warning?: NodeJS.Timeout;
    close?: NodeJS.Timeout;
};

const timers: Record<number, TimerRefs> = {};

export async function updateUserActivity(userId: number, chatId: number) {
    // Clear any existing timers for this user
    clearTimeout(timers[userId]?.warning);
    clearTimeout(timers[userId]?.close);

    // Update last activity timestamp
    await User.findOneAndUpdate({ userId }, { lastActivity: new Date() });

    const user = await User.findOne({ userId });
    if (user?.sessionBlocked) return;

    // 5 minutes timer
    /* 
    FOR TESTING PURPOSES 1 MINUTE WARNING AND SESION CLOSE
    On warning -> 30 * 1000, ---- 30sec warning
    On close -> 60 * 1000, ---- 1min close session
    */
    timers[userId] = {
        warning: setTimeout(async () => {
            await bot.sendMessage(chatId, i18next.t("session_mannager.session_warning"));
        }, 5 * 60 * 1000),
        close: setTimeout(async () => {
            await handleSessionTimeout(userId, chatId);
        }, 10 * 60 * 1000)
    };
}

async function handleSessionTimeout(userId: number, chatId: number) {
    await bot.sendMessage(chatId, i18next.t("session_mannager.session_closed"));
    await User.findOneAndUpdate(
        { userId },
        {
            sessionBlocked: true,
            $push: { sessionAuditLog: { event: "session_closed_inactivity", timestamp: new Date() } }
        }
    );
    clearTimeout(timers[userId]?.warning);
    clearTimeout(timers[userId]?.close);
    delete timers[userId];
}

export async function resetSession(userId: number) {
    await User.findOneAndUpdate(
        { userId },
        { sessionBlocked: false, lastActivity: new Date() }
    );
    clearTimeout(timers[userId]?.warning);
    clearTimeout(timers[userId]?.close);
    delete timers[userId];
}

export function isSessionBlocked(user) {
    return !!user?.sessionBlocked;
}