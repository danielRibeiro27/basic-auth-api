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

### Authentication vs Authorization: auth HTTP basic auth on `POST /login`. authz via API key
### API Key security: api key SHA-256 hash, password with bcrypt
### Test coverage and automation: jest for integration tests and postman collections for e2e

## Notes for study and recruiters

All technical notes from item 2 onward were moved to [TECHNICAL_NOTES.md](TECHNICAL_NOTES.md).
---
