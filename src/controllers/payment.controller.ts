import { Request, Response } from 'express';
import { catchErrors } from '@/utils/asyncHandler';
import { OK } from '@/constants/http';
import { verifyWebhookData } from '@/services/payos.service';
import { confirmPayment } from '@/services/order.service';

/**
 * Handle Webhook from PayOS
 */
export const payosWebhookHandler = catchErrors(async (req: Request, res: Response) => {
  const webhookBody = req.body;

  // Verify Webhook data structure and signature
  // Note: payOS.webhooks.verify returns the verified data (WebhookData)
  const verifiedData = await verifyWebhookData(webhookBody);

  // PayOS sends the event code in the root of the request body and within verifiedData
  // '00' in verifiedData.code indicates a successful payment
  if (webhookBody.code === '00' && verifiedData.code === '00') {
    await confirmPayment(verifiedData.orderCode);
  }

  return res.status(OK).json({
    success: true,
    message: 'Webhook received and processed',
  });
});
