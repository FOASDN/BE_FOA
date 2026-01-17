import mongoose from 'mongoose';

export default interface INotification extends mongoose.Document<mongoose.Types.ObjectId> {
  user_id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  expires_at: Date | null;
}
