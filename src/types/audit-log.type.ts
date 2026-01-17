import mongoose from 'mongoose';
import { Role } from './user.type';

export enum AuditLogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export default interface IAuditLog extends mongoose.Document<mongoose.Types.ObjectId> {
  user_id: mongoose.Types.ObjectId;
  entity_type: Role;
  action: AuditLogAction;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  created_at: Date;
}
