import { Router } from 'express';
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
        lastActivity: new Date(),
        sessionAuditLog: [{ event: 'token_generated', timestamp: new Date() }]
      });
      await user.save();
    } else {
      // Update existing user with new token
      user.token = token;
      user.lastActivity = new Date();
      user.sessionAuditLog.push({ event: 'token_updated', timestamp: new Date() });
      await user.save();
    }
    
    // Generate Telegram link
    const telegramBotUsername = "AdamoSignBot";
    const telegramLink = `https://t.me/${telegramBotUsername}?start=${encodeURIComponent(token)}`;

    return res.json({ success: true, telegram_link: telegramLink });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ success: false, message: 'Error al guardar los datos' });
  }
});

export default router;