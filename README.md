# basic-auth-api — Authn vs Authz Board
Simple api with basic authentication and api key management.

## 0) How to run
Just install docker and run the docker image and it will run a battery of tests (expect 8 tests passed requests with 200 OK, 201 CREATED, 200 OK and 200 OK)

#### 0.1) Build
docker -v >/dev/null 2>&1 && docker build -t basic-auth-api . || echo "install docker"

#### 0.2) Run Jest + Newman
docker run --rm basic-auth-api

#### 0.3) (Optional) Just start the server and tests it yourself
docker run --rm -p 3000:3000 --entrypoint node basic-auth-api src/index.js

## 1) Project goal

Build the simplest possible **real-world** authentication + authorization system.

### Notes for study and recruiters
All technical notes from item 2 onward were moved to [TECHNICAL_NOTES.md](TECHNICAL_NOTES.md).
---
