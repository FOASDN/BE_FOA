import { Router } from 'express';
import { payosWebhookHandler } from '@/controllers/payment.controller';

const paymentRoutes = Router();

/**
 * Public Webhook for PayOS
 * PayOS sends POST request to this endpoint
 */
paymentRoutes.post('/webhook/payos', payosWebhookHandler);

export default paymentRoutes;
