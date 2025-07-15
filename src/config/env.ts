import dotenv from "dotenv";
dotenv.config();

export const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
export const PUBLIC_URL = process.env.PUBLIC_URL!;
export const PORT = process.env.PORT || 3000;
export const MONGO_URI = process.env.MONGO_URI;
export const AWS_REGION = process.env.AWS_REGION;
export const AWS_ACCES_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;