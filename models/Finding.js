import mongoose from 'mongoose';

export const FIELDS = ['title', 'target', 'severity', 'status', 'description', 'bounty', 'tags'];
export const SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'];
export const STATUSES = ['new', 'triaged', 'resolved', 'duplicate', 'informative'];
export const DEFAULTS = { status: 'new', description: '', bounty: 0, tags: [] };

const findingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    target: { type: String, required: true, trim: true, maxlength: 200 },
    severity: { type: String, required: true },
    status: { type: String, default: DEFAULTS.status },
    description: { type: String, trim: true, maxlength: 5000, default: DEFAULTS.description },
    bounty: { type: Number, default: DEFAULTS.bounty },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const Finding = mongoose.model('Finding', findingSchema);
