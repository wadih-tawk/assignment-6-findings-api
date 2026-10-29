import mongoose from 'mongoose';
import { FIELDS, SEVERITIES, STATUSES } from '../models/Finding.js';

function isMissing(value) {
  return value === undefined || value === null || (typeof value === 'string' && !value.trim());
}

function checkText(field, value, max, errors) {
  if (typeof value !== 'string') {
    errors[field] = `${field} must be a string`;
  } else if (value.trim().length > max) {
    errors[field] = `${field} must be at most ${max} characters`;
  }
}

function checkChoice(field, value, choices, errors) {
  if (!choices.includes(value)) {
    errors[field] = `${field} must be one of: ${choices.join(', ')}`;
  }
}

function findErrors(body, partial) {
  const errors = {};
  const { title, target, severity, status, description, bounty, tags } = body;

  ['title', 'target', 'severity'].forEach(field => {
    if (isMissing(body[field]) && (!partial || body[field] !== undefined)) {
      errors[field] = `${field} is required`;
    }
  });

  if (title !== undefined && !errors.title) checkText('title', title, 120, errors);
  if (target !== undefined && !errors.target) checkText('target', target, 200, errors);
  if (severity !== undefined && !errors.severity) checkChoice('severity', severity, SEVERITIES, errors);
  if (status !== undefined) checkChoice('status', status, STATUSES, errors);
  if (description !== undefined) checkText('description', description, 5000, errors);

  if (bounty !== undefined && (typeof bounty !== 'number' || bounty < 0 || bounty > 1000000)) {
    errors.bounty = 'bounty must be a number from 0 to 1000000';
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      errors.tags = 'tags must be an array of strings';
    } else if (tags.length > 10) {
      errors.tags = 'tags can hold at most 10 tags';
    } else if (tags.filter(tag => typeof tag !== 'string' || !tag.trim() || tag.trim().length > 30).length > 0) {
      errors.tags = 'each tag must be a non-empty string of at most 30 characters';
    }
  }

  return errors;
}

function validate(req, res, next, partial) {
  const body = req.body;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object (send Content-Type: application/json)' });
  }
  if (partial && FIELDS.filter(field => body[field] !== undefined).length === 0) {
    return res.status(400).json({ error: `Send at least one field to update: ${FIELDS.join(', ')}` });
  }
  const errors = findErrors(body, partial);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  next();
}

export function validateFull(req, res, next) {
  validate(req, res, next, false);
}

export function validatePartial(req, res, next) {
  validate(req, res, next, true);
}

export function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  next();
}
