# Findings API

A RESTful API for tracking **bug bounty findings**: a vulnerability you reported, the target it affects, how severe it is, where it stands in triage, and what it paid. Built with **Node.js, Express and MongoDB (Mongoose)** for Assignment 6 — REST API Project.

Author: Wadih Tawk

---

## Tech stack

| Part | Choice |
|---|---|
| Runtime | Node.js **20.19 or later** (needed by Mongoose 9), ES modules (`"type": "module"`) |
| Framework | Express 5 |
| Database | MongoDB through Mongoose |
| Config | `dotenv`: the connection string lives in `.env`, which is git-ignored |
| Browser access | `cors`, allowing a Vite front end on `http://localhost:5173` |

## Project structure

```
Assignment_6_Findings_v2/
├── server.js                 config → middleware → routes → connect to MongoDB → listen
├── models/
│   └── Finding.js            Mongoose schema and model
├── handlers/
│   └── findings.js           one function per route
├── middleware/
│   ├── logger.js             prints "time METHOD /path" for every request
│   ├── validate.js           checks the id and the request body → 400 with clear messages
│   └── errors.js             catch-all 404 + JSON answer for malformed JSON
├── postman/
│   └── findings-api.postman_collection.json
├── evidence/                 curl transcript + server log
├── .env.example              copy to .env
├── .gitignore                node_modules and .env
├── package.json
└── package-lock.json
```

## Setup and run

**You need:** Node.js 20.19+ (`node -v`) and a MongoDB database.

**1. Install**

```bash
npm install
```

**2. Get a MongoDB connection string**, using any one of these:

- **MongoDB Atlas (free, cloud):** create a free cluster → *Database Access*: add a database user and password → *Network Access*: allow your IP → *Connect → Drivers*: copy the string, and put the database name `findings_api` right before the `?`:
  `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/findings_api?retryWrites=true&w=majority`
- **MongoDB installed locally:** `mongodb://127.0.0.1:27017/findings_api`
- **Docker:** `docker run -d --name findings-mongo -p 27017:27017 mongo:8`, then the local string above.

**3. Create `.env`**

```bash
cp .env.example .env
```

Replace the `MONGODB_URI` value with your connection string. `.env` is in `.gitignore`, so it never reaches git.

**4. Start**

```bash
npm run dev     # restarts on every save
npm start       # plain start
```

Expected output:

```
connected to MongoDB
Listening on http://localhost:3000
```

**If it does not start**

| You see | Fix |
|---|---|
| `MONGODB_URI is not set. Copy .env.example to .env …` | Do step 3 |
| `DB connection failed: …` | Check the connection string and password; on Atlas, check *Network Access* |
| Requests reach a different app, or nothing you send is saved | Another program already uses port 3000: stop it, or set another `PORT` in `.env` |

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `MONGODB_URI` | **yes** | — | MongoDB connection string |
| `PORT` | no | `3000` | Port the API listens on |

## The resource: a finding

| Field | Type | Required | Rules | Default |
|---|---|---|---|---|
| `title` | string | **yes** | 1–120 characters (spaces at the ends are trimmed) | — |
| `target` | string | **yes** | 1–200 characters (URL, domain, app…) | — |
| `severity` | string | **yes** | `info`, `low`, `medium`, `high` or `critical` | — |
| `status` | string | no | `new`, `triaged`, `resolved`, `duplicate` or `informative` | `"new"` |
| `description` | string | no | up to 5000 characters | `""` |
| `bounty` | number | no | from 0 to 1,000,000 | `0` |
| `tags` | array of strings | no | at most 10, each 1–30 characters | `[]` |

The server sets `_id`, `createdAt` and `updatedAt` (plus Mongoose's `__v`); the client cannot. Any other field in a request body is ignored.

## Routes

Base URL: `http://localhost:3000`. Send bodies as JSON with `Content-Type: application/json`.

| Method | Path | Does | Success | Can fail with |
|---|---|---|---|---|
| `GET` | `/` | Health check | `200` | — |
| `GET` | `/api/findings` | List findings, newest first | `200` | — |
| `GET` | `/api/findings/:id` | Get one finding | `200` | `400` bad id · `404` |
| `POST` | `/api/findings` | Create a finding | `201` | `400` |
| `PUT` | `/api/findings/:id` | Replace a whole finding | `200` | `400` · `404` |
| `PATCH` | `/api/findings/:id` | Change some fields | `200` | `400` · `404` |
| `DELETE` | `/api/findings/:id` | Delete a finding | `204` (no body) | `400` bad id · `404` |

Any other path returns `404`. If the database fails during a request, the answer is `500`.

The examples below come from [`evidence/curl-transcript.md`](evidence/curl-transcript.md), where every command was really executed. That run used `PORT=3001` because another server was already using 3000 on that machine; the responses are the same on any port. Your ids and timestamps will differ.

### `GET /` — health check

```bash
curl localhost:3000/
```

`200 OK`

```json
{ "status": "ok" }
```

### `POST /api/findings` — create a finding

Required: `title`, `target`, `severity`. Optional: `status`, `description`, `bounty`, `tags`.

```bash
curl -X POST localhost:3000/api/findings \
  -H 'Content-Type: application/json' \
  -d '{"title":"SQL injection in login form","target":"https://shop.example.com/login","severity":"critical","description":"The username parameter is concatenated into a SQL query.","bounty":1500,"tags":["sqli","auth"]}'
```

`201 Created`

```json
{
  "title": "SQL injection in login form",
  "target": "https://shop.example.com/login",
  "severity": "critical",
  "status": "new",
  "description": "The username parameter is concatenated into a SQL query.",
  "bounty": 1500,
  "tags": ["sqli", "auth"],
  "_id": "6ae2a91a798825142e2b87c6",
  "createdAt": "2026-10-29T02:02:02.835Z",
  "updatedAt": "2026-10-29T02:02:02.835Z",
  "__v": 0
}
```

With only the required fields, the others get their defaults:

```bash
curl -X POST localhost:3000/api/findings \
  -H 'Content-Type: application/json' \
  -d '{"title":"Stored XSS in comments","target":"https://blog.example.org/post/7","severity":"high"}'
```

`201 Created`

```json
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

### `GET /api/findings` — list findings

Newest first. Optional query parameters, which can be combined:

| Query | Meaning | Example |
|---|---|---|
| `severity` | only this severity | `?severity=critical` |
| `status` | only this status | `?status=triaged` |
| `search` | text found in the title, case-insensitive | `?search=xss` |

```bash
curl localhost:3000/api/findings
```

`200 OK`

```json
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
    "tags": ["sqli", "auth"],
    "createdAt": "2026-10-29T02:02:02.835Z",
    "updatedAt": "2026-10-29T02:02:02.835Z",
    "__v": 0
  }
]
```

With a query (put the URL in quotes: in zsh an unquoted `?` is a wildcard):

```bash
curl 'localhost:3000/api/findings?search=xss'
```

`200 OK`: only the matching findings, same shape (here, just the "Stored XSS in comments" finding). No match gives `200` with `[]`.

### `GET /api/findings/:id` — get one finding

```bash
curl localhost:3000/api/findings/6ae2a91a798825142e2b87c6
```

`200 OK`

```json
{
  "_id": "6ae2a91a798825142e2b87c6",
  "title": "SQL injection in login form",
  "target": "https://shop.example.com/login",
  "severity": "critical",
  "status": "new",
  "description": "The username parameter is concatenated into a SQL query.",
  "bounty": 1500,
  "tags": ["sqli", "auth"],
  "createdAt": "2026-10-29T02:02:02.835Z",
  "updatedAt": "2026-10-29T02:02:02.835Z",
  "__v": 0
}
```

### `PUT /api/findings/:id` — replace a finding

PUT sends the **whole** finding: `title`, `target` and `severity` are required, and optional fields you leave out go back to their defaults.

```bash
curl -X PUT localhost:3000/api/findings/6ae2a91a798825142e2b87c6 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Blind SQL injection in login form","target":"https://shop.example.com/login","severity":"high","status":"triaged"}'
```

`200 OK` with the new version (`bounty`, `description` and `tags` were reset):

```json
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

### `PATCH /api/findings/:id` — change some fields

PATCH changes **only the fields you send**. Send at least one.

```bash
curl -X PATCH localhost:3000/api/findings/6ae2a91a798825142e2b87c6 \
  -H 'Content-Type: application/json' \
  -d '{"status":"resolved","bounty":2000}'
```

`200 OK` with the new version:

```json
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

### `DELETE /api/findings/:id` — delete a finding

```bash
curl -i -X DELETE localhost:3000/api/findings/6ae2a91a798825142e2b87c6
```

`204 No Content`: it worked, and there is no body. Asking for the same id afterwards:

`404 Not Found`

```json
{ "error": "Finding not found" }
```

## Errors and status codes

Errors are JSON with an `error` message. Validation errors add `details`, with one message per bad field.

| Status | When | Example body |
|---|---|---|
| `400` | Missing fields | `{"error":"Validation failed","details":{"title":"title is required","target":"target is required","severity":"severity is required"}}` |
| `400` | Invalid values (all reported at once) | `{"error":"Validation failed","details":{"severity":"severity must be one of: info, low, medium, high, critical","bounty":"bounty must be a number from 0 to 1000000","tags":"tags must be an array of strings"}}` |
| `400` | A non-string where text is expected | `{"error":"Validation failed","details":{"title":"title must be a string"}}` |
| `400` | Malformed JSON | `{"error":"Malformed JSON in request body"}` |
| `400` | Body missing, not JSON, or an array | `{"error":"Request body must be a JSON object (send Content-Type: application/json)"}` |
| `400` | PATCH with no known field | `{"error":"Send at least one field to update: title, target, severity, status, description, bounty, tags"}` |
| `400` | Id that is not a valid MongoDB ObjectId | `{"error":"Invalid id"}` |
| `404` | Valid id, but no such finding | `{"error":"Finding not found"}` |
| `404` | Unknown route | `{"error":"Not found"}` |
| `500` | The database failed during the request | `{"error":"Internal server error"}` |

Bad input or a missing record never crashes the server. On a `500`, the real error is printed in the server's terminal, not sent to the client.

## Testing the API

**Postman / Thunder Client:** `postman/findings-api.postman_collection.json` holds all **24 requests** (12 CRUD, 12 error cases), each with a check on its status code.

1. Start the server (`npm run dev`).
2. Postman: *Import* → choose the file → open the collection → *Run*. Thunder Client: *Collections* → menu → *Import*.
3. Run the folders in order: the create requests save the new ids in the `findingId` / `secondId` variables that later requests use. If your server isn't on port 3000, change the `baseUrl` variable.

**curl:** every command in [`evidence/curl-transcript.md`](evidence/curl-transcript.md) can be pasted into a terminal (change the port to 3000).

**Evidence included** (`evidence/`):

| File | What it shows |
|---|---|
| `curl-transcript.md` | 23 curl commands: full CRUD, a server restart showing the data is still in MongoDB, and the error cases, each with its real response |
| `server-log.txt` | What the server printed during that run |

## Design decisions

- **Nouns in the URL, verbs in the method:** `/api/findings` for the list, `/api/findings/:id` for one finding.
- **PUT and PATCH:** PUT replaces the whole finding; PATCH changes only what is sent.
- **Status codes that match the outcome:** `201` on create, `204` with no body on delete, `400` for an id that cannot exist, `404` for one that doesn't.
- **Validation before the database:** `middleware/validate.js` checks every field and reports all problems at once.
- **The server owns `_id` and the timestamps:** only the seven fields above are copied from a request body.
- **Connect first, then listen:** the server only starts accepting requests once MongoDB is connected.
