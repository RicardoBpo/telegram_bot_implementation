import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from 'cors';
import path from 'path';

import { bot } from "../bot";
import { TELEGRAM_TOKEN, PUBLIC_URL, PORT, MONGO_URI } from "../config/env";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(bodyParser.json());

bot.setWebHook(`${PUBLIC_URL}/bot${TELEGRAM_TOKEN}`);

// Send messages to this route
app.post(`/bot${TELEGRAM_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});
  
app.post('/start', async (req, res) => {
  const {  token, platform, phone } = req.body;

  if (!token || platform !== 'telegram' || !phone) {
    return res.status(400).json({ success: false, message: 'Datos inválidos' });
  }

  try {
    const telegramBotUsername = 'AdamoSignBot';
    const startParam = `${encodeURIComponent(phone)}_${encodeURIComponent(token)}`;
    const telegramLink = `https://t.me/${telegramBotUsername}?start=${startParam}`;

    return res.json({ success: true, telegram_link: telegramLink });
  } catch (error) {
    console.error('Error iniciando flujo:', error);
    return res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
});

// Initialize DB
mongoose.connect(MONGO_URI).then(() => {
    console.log("Mongo connected");
}).catch(console.error);

// Start server
app.listen(PORT, () => {
    console.log("Server running");
})
