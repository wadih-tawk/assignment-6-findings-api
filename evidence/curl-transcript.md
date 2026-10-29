# curl transcript — Findings API

Every command below was **actually executed** and the output pasted unedited, except that
response headers are trimmed to the status line (plus `Location` on 201) and JSON bodies are pretty-printed.

- Run on: 2026-10-29T02:02:02.788Z
- Node.js v24.22.1, MongoDB 8.2.6 (local instance), server started with `node server.js` and `PORT=3001` (the default 3000 was busy on this machine)
- Ids are real MongoDB ObjectIds from this run, so yours will differ.

## Part 1 · CRUD (happy path)

### 1. Health check

```bash
curl -s -i localhost:3001/
```

```http
HTTP/1.1 200 OK

{
  "status": "ok"
}
```

### 2. Create a finding

```bash
curl -s -i -X POST localhost:3001/api/findings \
  -H 'Content-Type: application/json' \
  -d '{"title":"SQL injection in login form","target":"https://shop.example.com/login","severity":"critical","description":"The username parameter is concatenated into a SQL query.","bounty":1500,"tags":["sqli","auth"]}'
```

```http
HTTP/1.1 201 Created

{
  "title": "SQL injection in login form",
  "target": "https://shop.example.com/login",
  "severity": "critical",
  "status": "new",
  "description": "The username parameter is concatenated into a SQL query.",
  "bounty": 1500,
  "tags": [
    "sqli",
    "auth"
  ],
  "_id": "6ae2a91a798825142e2b87c6",
  "createdAt": "2026-10-29T02:02:02.835Z",
  "updatedAt": "2026-10-29T02:02:02.835Z",
  "__v": 0
}
```

### 3. Create a second finding (only the required fields)

```bash
curl -s -i -X POST localhost:3001/api/findings \
  -H 'Content-Type: application/json' \
  -d '{"title":"Stored XSS in comments","target":"https://blog.example.org/post/7","severity":"high"}'
```

```http
HTTP/1.1 201 Created

{
  "title": "Stored XSS in comments",
  "target": "https://blog.example.org/post/7",
  "severity": "high",
  "status": "new",
  "description": "",
  "bounty": 0,
  "tags": [],
  "_id": "6ae2a91a798825142e2b87c7",
  "createdAt": "2026-10-29T02:02:02.849Z",
  "updatedAt": "2026-10-29T02:02:02.849Z",
  "__v": 0
}
```

### 4. List all findings (newest first)

```bash
curl -s -i localhost:3001/api/findings
```

```http
HTTP/1.1 200 OK

[
  {
    "_id": "6ae2a91a798825142e2b87c7",
    "title": "Stored XSS in comments",
    "target": "https://blog.example.org/post/7",
    "severity": "high",
    "status": "new",
    "description": "",
    "bounty": 0,
    "tags": [],
    "createdAt": "2026-10-29T02:02:02.849Z",
    "updatedAt": "2026-10-29T02:02:02.849Z",
    "__v": 0
  },
  {
    "_id": "6ae2a91a798825142e2b87c6",
    "title": "SQL injection in login form",
    "target": "https://shop.example.com/login",
    "severity": "critical",
    "status": "new",
    "description": "The username parameter is concatenated into a SQL query.",
    "bounty": 1500,
    "tags": [
      "sqli",
      "auth"
    ],
    "createdAt": "2026-10-29T02:02:02.835Z",
    "updatedAt": "2026-10-29T02:02:02.835Z",
    "__v": 0
  }
]
```

### 5. List with a filter: only critical

```bash
curl -s -i 'localhost:3001/api/findings?severity=critical'
```

```http
HTTP/1.1 200 OK

[
  {
    "_id": "6ae2a91a798825142e2b87c6",
    "title": "SQL injection in login form",
    "target": "https://shop.example.com/login",
    "severity": "critical",
    "status": "new",
    "description": "The username parameter is concatenated into a SQL query.",
    "bounty": 1500,
    "tags": [
      "sqli",
      "auth"
    ],
    "createdAt": "2026-10-29T02:02:02.835Z",
    "updatedAt": "2026-10-29T02:02:02.835Z",
    "__v": 0
  }
]
```

### 6. Search by title (case-insensitive)

```bash
curl -s -i 'localhost:3001/api/findings?search=xss'
```

```http
HTTP/1.1 200 OK

[
  {
    "_id": "6ae2a91a798825142e2b87c7",
    "title": "Stored XSS in comments",
    "target": "https://blog.example.org/post/7",
    "severity": "high",
    "status": "new",
    "description": "",
    "bounty": 0,
    "tags": [],
    "createdAt": "2026-10-29T02:02:02.849Z",
    "updatedAt": "2026-10-29T02:02:02.849Z",
    "__v": 0
  }
]
```

### 7. Get one finding

```bash
curl -s -i localhost:3001/api/findings/6ae2a91a798825142e2b87c6
```

```http
HTTP/1.1 200 OK

{
  "_id": "6ae2a91a798825142e2b87c6",
  "title": "SQL injection in login form",
  "target": "https://shop.example.com/login",
  "severity": "critical",
  "status": "new",
  "description": "The username parameter is concatenated into a SQL query.",
  "bounty": 1500,
  "tags": [
    "sqli",
    "auth"
  ],
  "createdAt": "2026-10-29T02:02:02.835Z",
  "updatedAt": "2026-10-29T02:02:02.835Z",
  "__v": 0
}
```

### 8. Replace a finding (PUT — fields left out go back to their defaults)

```bash
curl -s -i -X PUT localhost:3001/api/findings/6ae2a91a798825142e2b87c6 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Blind SQL injection in login form","target":"https://shop.example.com/login","severity":"high","status":"triaged"}'
```

```http
HTTP/1.1 200 OK

{
  "_id": "6ae2a91a798825142e2b87c6",
  "title": "Blind SQL injection in login form",
  "target": "https://shop.example.com/login",
  "severity": "high",
  "status": "triaged",
  "description": "",
  "bounty": 0,
  "tags": [],
  "createdAt": "2026-10-29T02:02:02.835Z",
  "updatedAt": "2026-10-29T02:02:02.909Z",
  "__v": 0
}
```

### 9. Update part of a finding (PATCH — only what you send changes)

```bash
curl -s -i -X PATCH localhost:3001/api/findings/6ae2a91a798825142e2b87c6 \
  -H 'Content-Type: application/json' \
  -d '{"status":"resolved","bounty":2000}'
```

```http
HTTP/1.1 200 OK

{
  "_id": "6ae2a91a798825142e2b87c6",
  "title": "Blind SQL injection in login form",
  "target": "https://shop.example.com/login",
  "severity": "high",
  "status": "resolved",
  "description": "",
  "bounty": 2000,
  "tags": [],
  "createdAt": "2026-10-29T02:02:02.835Z",
  "updatedAt": "2026-10-29T02:02:02.924Z",
  "__v": 0
}
```

### 10. Delete a finding

```bash
curl -s -i -X DELETE localhost:3001/api/findings/6ae2a91a798825142e2b87c6
```

```http
HTTP/1.1 204 No Content
```

### 11. Get the deleted finding

```bash
curl -s -i localhost:3001/api/findings/6ae2a91a798825142e2b87c6
```

```http
HTTP/1.1 404 Not Found

{
  "error": "Finding not found"
}
```

## Part 2 · Persistence — restart the server, the data is still there

> The server process was stopped (`SIGTERM`, same as Ctrl+C) and started again with `node server.js`.

### 12. The second finding survived the restart

```bash
curl -s -i localhost:3001/api/findings/6ae2a91a798825142e2b87c7
```

```http
HTTP/1.1 200 OK

{
  "_id": "6ae2a91a798825142e2b87c7",
  "title": "Stored XSS in comments",
  "target": "https://blog.example.org/post/7",
  "severity": "high",
  "status": "new",
  "description": "",
  "bounty": 0,
  "tags": [],
  "createdAt": "2026-10-29T02:02:02.849Z",
  "updatedAt": "2026-10-29T02:02:02.849Z",
  "__v": 0
}
```

## Part 3 · Validation and errors

### 13. Missing required fields

```bash
curl -s -i -X POST localhost:3001/api/findings \
  -H 'Content-Type: application/json' \
  -d '{}'
```

```http
HTTP/1.1 400 Bad Request

{
  "error": "Validation failed",
  "details": {
    "title": "title is required",
    "target": "target is required",
    "severity": "severity is required"
  }
}
```

### 14. Invalid values (several problems reported at once)

```bash
curl -s -i -X POST localhost:3001/api/findings \
  -H 'Content-Type: application/json' \
  -d '{"title":"Open redirect","target":"shop.example.com","severity":"extreme","bounty":-5,"tags":"web"}'
```

```http
HTTP/1.1 400 Bad Request

{
  "error": "Validation failed",
  "details": {
    "severity": "severity must be one of: info, low, medium, high, critical",
    "bounty": "bounty must be a number from 0 to 1000000",
    "tags": "tags must be an array of strings"
  }
}
```

### 15. NoSQL operator instead of a string

```bash
curl -s -i -X POST localhost:3001/api/findings \
  -H 'Content-Type: application/json' \
  -d '{"title":{"$gt":""},"target":"x","severity":"low"}'
```

```http
HTTP/1.1 400 Bad Request

{
  "error": "Validation failed",
  "details": {
    "title": "title must be a string"
  }
}
```

### 16. Malformed JSON

```bash
curl -s -i -X POST localhost:3001/api/findings \
  -H 'Content-Type: application/json' \
  -d '{"title": "Broken JSON",'
```

```http
HTTP/1.1 400 Bad Request

{
  "error": "Malformed JSON in request body"
}
```

### 17. Body sent as text/plain instead of JSON

```bash
curl -s -i -X POST localhost:3001/api/findings \
  -H 'Content-Type: text/plain' \
  -d '{"title":"x"}'
```

```http
HTTP/1.1 400 Bad Request

{
  "error": "Request body must be a JSON object (send Content-Type: application/json)"
}
```

### 18. Invalid id format

```bash
curl -s -i localhost:3001/api/findings/abc
```

```http
HTTP/1.1 400 Bad Request

{
  "error": "Invalid id"
}
```

### 19. Valid id format, but no such finding

```bash
curl -s -i localhost:3001/api/findings/507f1f77bcf86cd799439011
```

```http
HTTP/1.1 404 Not Found

{
  "error": "Finding not found"
}
```

### 20. PUT without every required field

```bash
curl -s -i -X PUT localhost:3001/api/findings/6ae2a91a798825142e2b87c7 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Only a title"}'
```

```http
HTTP/1.1 400 Bad Request

{
  "error": "Validation failed",
  "details": {
    "target": "target is required",
    "severity": "severity is required"
  }
}
```

### 21. PATCH with nothing to update

```bash
curl -s -i -X PATCH localhost:3001/api/findings/6ae2a91a798825142e2b87c7 \
  -H 'Content-Type: application/json' \
  -d '{}'
```

```http
HTTP/1.1 400 Bad Request

{
  "error": "Send at least one field to update: title, target, severity, status, description, bounty, tags"
}
```

### 22. Unknown route

```bash
curl -s -i localhost:3001/api/nope
```

```http
HTTP/1.1 404 Not Found

{
  "error": "Not found"
}
```

### 23. Clean up

```bash
curl -s -i -X DELETE localhost:3001/api/findings/6ae2a91a798825142e2b87c7
```

```http
HTTP/1.1 204 No Content
```

