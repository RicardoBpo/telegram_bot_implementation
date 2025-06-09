import 'dotenv/config'
import TelegramBot from "node-telegram-bot-api"

import { TELEGRAM_TOKEN } from "../config/env"

// WebHook
export const bot = new TelegramBot(TELEGRAM_TOKEN, { webHook: { port: false } });