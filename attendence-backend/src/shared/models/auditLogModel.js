import mongoose from 'mongoose';
const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);