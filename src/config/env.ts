import dotenv from "dotenv";
dotenv.config();

export const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
export const PUBLIC_URL = process.env.PUBLIC_URL!;
export const PORT = process.env.PORT || 3000;
export const MONGO_URI = process.env.MONGO_URI;