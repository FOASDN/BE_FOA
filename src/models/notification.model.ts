import { INotification } from '@/types';
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    user_id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    expires_at: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema, 'notifications');

export default NotificationModel;
