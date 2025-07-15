import { Router } from 'express';
import { bot } from '../bot/index'; 
import User from '../models/userSchema';

const router = Router();

router.post('/send', async (req, res) => {
  const { phone, token } = req.body;

  if (!phone || !token) {
    return res.status(400).json({ success: false, message: 'Datos inválidos' });
  }

  try {
    // Check if user with this phone already exists
    let user = await User.findOne({ phoneNumber: phone });

    if (!user) {
      // Create a new user if none exists
      user = new User({
        phoneNumber: phone,
        token: token,
        identityStep: "askCountry",
        termsAccepted: false
      });
      await user.save();
    } else {
      // Update existing user with new token
      user.token = token;
      user.identityStep = "done";
      user.lastActivity = new Date();
      user.sessionAuditLog.push({ event: 'token_updated', timestamp: new Date() });
      await user.save();
    }

    // Generate Telegram link
    const telegramBotUsername = "AdamoSignBot";
    /* const startParam = `${encodeURIComponent(phoneNumber)}_${encodeURIComponent(token)}`; */
    const telegramLink = `https://t.me/${telegramBotUsername}?start=${encodeURIComponent(token)}`;

    return res.json({ success: true, telegram_link: telegramLink });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ success: false, message: 'Error al guardar los datos' });
  }
});

router.post('/signed', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Datos inválidos' });
  }

  try {
    // Check if user with this phone exists
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Update user as signed
    user.identityStep = "signed";
    user.lastActivity = new Date();
    user.sessionAuditLog.push({ event: 'signed', timestamp: new Date() });
    await user.save();

    if (user.userId) {
      await bot.sendMessage(
        user.userId,
        "✅ ¡Documento firmado correctamente! Gracias por usar Adamo ign."
      );
    }

    return res.json({ success: true, message: 'Estado actualizado', to: user.userId });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar estado' });
  }
})

export default router;