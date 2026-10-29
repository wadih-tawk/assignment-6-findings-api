export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function handleErrors(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
