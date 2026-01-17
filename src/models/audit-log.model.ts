import { IAuditLog } from '@/types';
import { Role } from '@/types/user.type';
import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema<IAuditLog>({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  entity_type: { type: String, required: true },
  action: { type: String, required: true, enum: Role },
  old_data: { type: Object },
  new_data: { type: Object },
  created_at: { type: Date, required: true },
});

//indexes
AuditLogSchema.index({ user_id: 1 });
AuditLogSchema.index({ entity_type: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ created_at: -1 });

const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema, 'audit_logs');

export default AuditLogModel;
