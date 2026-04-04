# basic-auth-api — Authn vs Authz Board
Simple api with basic authentication and api key management.

## 0) How to run
Just run the docker image and it will run a battery of tests (expect 8 tests passed requests with 200 OK, 201 CREATED, 200 OK and 200 OK)

#### 0.1) Build
docker build -t basic-auth-api .

#### 0.2) Run Jest + Newman
docker run --rm basic-auth-api

#### 0.3) (Optional) Just start the server and tests it yourself
docker run --rm -p 3000:3000 --entrypoint node basic-auth-api src/index.js

## 1) Project goal

Build the simplest possible **real-world** authentication + authorization system.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express 5 |
| Password hashing | bcrypt |
| In-memory storage | Plain JS `Map` (no database) |
| Unit / integration tests | Jest + Supertest |
| API / contract tests | Newman (Postman CLI) |
| Containerization | Docker |

---

## Core Concepts

### Authentication vs Authorization
- **Authentication (Authn)** — proves identity: *who is calling?* Implemented via HTTP Basic Auth on `POST /login`.
- **Authorization (Authz)** — enforces permissions: *what are they allowed to do?* Implemented via an API key header on every protected route.

### API Key security
- Raw keys are **never stored**; only a SHA-256 hash (with an 8-char prefix for lookup support) is persisted.
- The raw key is returned **once** at creation time and is the client's responsibility to store.
- Constant-time comparison is used when validating keys to prevent timing attacks.

### HTTP Basic Auth
- Credentials (username + password) are base64-encoded in the `Authorization: Basic <token>` header.
- Used exclusively on `POST /login`; all other protected routes use the issued API key.

---

### Notes for study and recruiters
All technical notes from item 2 onward were moved to [TECHNICAL_NOTES.md](TECHNICAL_NOTES.md).
---
