import { Finding, FIELDS, DEFAULTS } from '../models/Finding.js';

function pick(body) {
  const data = {};
  FIELDS.forEach(field => {
    if (body[field] !== undefined) data[field] = body[field];
  });
  if (data.tags) data.tags = data.tags.map(tag => tag.trim());
  return data;
}

function handleError(res, err) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

export async function listFindings(req, res) {
  try {
    const { severity, status, search } = req.query;
    const filter = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search.trim(), $options: 'i' };
    const findings = await Finding.find(filter).sort({ createdAt: -1 });
    res.json(findings);
  } catch (err) {
    handleError(res, err);
  }
}

export async function getFinding(req, res) {
  try {
    const finding = await Finding.findById(req.params.id);
    if (!finding) return res.status(404).json({ error: 'Finding not found' });
    res.json(finding);
  } catch (err) {
    handleError(res, err);
  }
}

export async function createFinding(req, res) {
  try {
    const finding = await Finding.create(pick(req.body));
    res.status(201).json(finding);
  } catch (err) {
    handleError(res, err);
  }
}

export async function replaceFinding(req, res) {
  try {
    const data = { ...DEFAULTS, ...pick(req.body) };
    const finding = await Finding.findByIdAndUpdate(req.params.id, data, { returnDocument: 'after', runValidators: true });
    if (!finding) return res.status(404).json({ error: 'Finding not found' });
    res.json(finding);
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateFinding(req, res) {
  try {
    const finding = await Finding.findByIdAndUpdate(req.params.id, pick(req.body), { returnDocument: 'after', runValidators: true });
    if (!finding) return res.status(404).json({ error: 'Finding not found' });
    res.json(finding);
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteFinding(req, res) {
  try {
    const finding = await Finding.findByIdAndDelete(req.params.id);
    if (!finding) return res.status(404).json({ error: 'Finding not found' });
    res.sendStatus(204);
  } catch (err) {
    handleError(res, err);
  }
}
