import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware';
import type { AuthUser } from '../middleware/auth.middleware';
import { whatsappService } from '../services/whatsapp.service';

const router = new Hono<{ Variables: { user: AuthUser } }>();
router.use('*', authMiddleware);

// Get WA connection status
router.get('/status', (c) => {
  const status = whatsappService.getStatus();
  return c.json(status);
});

// Get QR code for pairing
router.get('/qr', async (c) => {
  const user = c.get('user') as AuthUser;
  try {
    const result = await whatsappService.connect(user.id);
    if (result.needsQR) {
      const qr = whatsappService.getQRCode();
      return c.json({ status: 'needs_qr', qrCode: qr || result.qr || null });
    }
    return c.json({ status: 'connected', qrCode: null });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

// Initiate connection
router.post('/connect', async (c) => {
  const user = c.get('user') as AuthUser;
  try {
    const result = await whatsappService.connect(user.id);
    if (result.needsQR) {
      return c.json({ status: 'needs_qr', qrCode: result.qr || whatsappService.getQRCode() });
    }
    return c.json({ status: 'connected', phoneNumber: whatsappService.getStatus().phoneNumber });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

// Disconnect session
router.post('/disconnect', async (c) => {
  try {
    await whatsappService.disconnect();
    return c.json({ success: true, message: 'Disconnected' });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// List WA groups
router.get('/groups', async (c) => {
  try {
    const groups = await whatsappService.getGroups();
    return c.json({ data: groups });
  } catch (error: any) {
    return c.json({ data: [], error: error.message }, 400);
  }
});

// Send message to a group
router.post('/send', async (c) => {
  const { groupId, message } = await c.req.json();
  try {
    const result = await whatsappService.sendMessage(groupId, message);
    return c.json({ success: true, messageId: result?.key?.id });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
});

export default router;
