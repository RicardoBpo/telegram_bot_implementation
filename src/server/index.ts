import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { bot } from "../bot";
import { TELEGRAM_TOKEN, PUBLIC_URL, PORT, MONGO_URI } from "../config/env";

const app = express();
app.use(bodyParser.json());

bot.setWebHook(`${PUBLIC_URL}/bot${TELEGRAM_TOKEN}`);
// Initialize DB


// Send messages to this route
app.post(`/bot${TELEGRAM_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

mongoose.connect(MONGO_URI).then(() => {
    console.log("Mongo connected");

    // Start server
    app.listen(PORT, () => {
        console.log("Server running");
    })
}).catch(console.error);
