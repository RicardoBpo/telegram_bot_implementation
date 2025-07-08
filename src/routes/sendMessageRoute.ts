import { Router } from 'express';

const router = Router();

router.post('/start', async (req, res) => {
  const { phone, token } = req.body;

  if (!phone || !token) {
    return res.status(400).json({ success: false, message: 'Datos inválidos' });
  }

  // Aquí puedes guardar el token y teléfono en la base de datos, o devolver el link de Telegram
    const telegramBotUsername = "AdamoSignBot";
    const telegramLink = `https://t.me/${telegramBotUsername}?start=${encodeURIComponent(token)}`;

    return res.json({ success: true, telegram_link: telegramLink });
});

export default router;