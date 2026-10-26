# Docker setup

This guide covers the container setup for the Kochi Guru Pizza website. The application has two parts: a Next.js frontend that serves the website and dashboard, and an Express backend that handles authentication, menu data, and image operations. The root `docker-compose.yml` builds and runs those two applications together so they can communicate over the Compose network.

MongoDB is **not** part of the current Compose configuration. The backend must connect to an existing MongoDB instance, and it still needs Google OAuth and Cloudflare R2 credentials. If you want to work on the source code without containers, follow the [main project README](../../README.md) instead.

## Files and services

```text
kochi-guru-pizza/
├── docker-compose.yml
├── .env                         # Frontend API URL used during image build
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .env                     # Backend runtime configuration
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .env                     # Frontend runtime configuration
└── docs/docker/README.md
```

| Service | Container port | Host port | Notes |
| --- | --- | --- | --- |
| `frontend` | `3000` | `3000` | Next.js website |
| `backend` | `5000` | `5000` | Express API, mounted at `/v1` |

Both Dockerfiles use **Node.js 24 Alpine** and build the TypeScript applications before starting them. Compose sets `INTERNAL_API_URL=http://backend:5000/v1` for the frontend, allowing server-side Next.js requests to reach the API by its service name.

The browser cannot use `backend` as a hostname. Browser requests need a public or host-accessible URL such as `http://localhost:5000/v1`.

## Requirements

- Docker Engine with Compose, or Docker Desktop
- A MongoDB database reachable from the backend container
- Google OAuth client credentials
- A Cloudflare R2 bucket and API credentials
- Available host ports `3000` and `5000`

Run all Compose commands in this document from the **repository root**, where `docker-compose.yml` is located.

## Environment configuration

The Compose file reads settings from three places. They serve different purposes, so configure all three before building.

### 1. Root `.env`

Create `.env` next to `docker-compose.yml`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/v1
```

Compose supplies this variable as a frontend **build argument**. Next.js needs the browser-facing API URL at build time because `NEXT_PUBLIC_` values are bundled into client-side code.

### 2. Backend `backend/.env`

```dotenv
PORT=5000
NODE_ENV=development
MONGO_DB_URI=your-mongodb-connection-string
FRONTEND_URL=http://localhost:3000

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=replace-with-a-different-long-random-secret
REFRESH_TOKEN_EXPIRES_IN=30d
MAX_ACTIVE_SESSIONS=5

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/v1/auth/google/callback

CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_DOMAIN=https://your-r2-public-domain.example
```

`MONGO_DB_URI` must work **from inside the container**. If MongoDB is running directly on your machine, `127.0.0.1` inside the backend container refers to the container itself, not your host. Use a reachable database hostname, a suitable host address, or a managed MongoDB connection string.

For Google sign-in, add `http://localhost:5000/v1/auth/google/callback` to your OAuth client's authorized redirect URIs. The redirect URI needs to match the running backend address.

### 3. Frontend `frontend/.env`

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/v1
```

This file is loaded by the frontend container at runtime. `INTERNAL_API_URL` is already set in `docker-compose.yml` to `http://backend:5000/v1` for server-side traffic.

Keep the public URL in the root `.env` and `frontend/.env` consistent. All real secrets and environment files should stay out of Git.

## Start the application

Build the images and start the services:

```bash
docker compose up --build -d
```

Check the containers:

```bash
docker compose ps
```

Follow startup logs if something does not come up:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

Once the services are running:

| Service | URL |
| --- | --- |
| Website | http://localhost:3000 |
| Backend | http://localhost:5000 |
| Public menu endpoint | http://localhost:5000/v1/menu |

The `frontend` service has `depends_on: backend`, which controls startup order but **does not guarantee that the backend or MongoDB connection is ready**. If the menu cannot load immediately, check the backend logs first.

## Commands

All commands here work in both Windows PowerShell and Linux Bash.

| Command | Purpose |
| --- | --- |
| `docker compose up --build -d` | Build images and start services in the background |
| `docker compose up -d` | Start services using existing images |
| `docker compose ps` | Show container status and ports |
| `docker compose logs -f` | Stream logs from both services |
| `docker compose logs -f backend` | Stream API logs |
| `docker compose logs -f frontend` | Stream website logs |
| `docker compose build backend` | Rebuild the backend image |
| `docker compose build frontend` | Rebuild the frontend image |
| `docker compose restart backend` | Restart the backend container |
| `docker compose restart frontend` | Restart the frontend container |
| `docker compose stop` | Stop services without removing containers |
| `docker compose start` | Start previously stopped services |
| `docker compose down` | Stop and remove service containers and networks |
| `docker compose down --rmi all` | Also remove the service images |
| `docker compose config` | Show the resolved Compose configuration |

Be careful when sharing `docker compose config` output; it can include environment values. `down --rmi all` removes built images, so the next start will need a rebuild.

## After changing code or configuration

Container images contain the application code built at image-build time. Rebuild the changed service when source code changes:

```bash
# Frontend source changes
docker compose up -d --build frontend

# Backend source changes
docker compose up -d --build backend
```

Changing environment values does not update an already running container. Recreate the services:

```bash
docker compose up -d --force-recreate backend frontend
```

If you change `NEXT_PUBLIC_API_URL`, **rebuild the frontend** as well:

```bash
docker compose up -d --build frontend
```

This matters because a `NEXT_PUBLIC_` variable is built into the browser bundle. Restarting a container alone will not replace an old value baked into the frontend code.

## How the containers communicate

```text
Browser
  |
  +---- http://localhost:3000 --------> frontend (Next.js)
  |                                           |
  +---- http://localhost:5000/v1 ------------+----> backend (Express)
                                              ^
                   Server-side fetches --------+
                   use http://backend:5000/v1
                                              |
                                         external services
                                         MongoDB / R2 / Google
```

The backend allows requests from `FRONTEND_URL` through CORS. When moving this setup to a different domain, update the frontend public API URL, backend allowed origin, and Google OAuth callback together.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Compose reports a missing env file | `backend/.env` and `frontend/.env` exist at the correct paths |
| Frontend calls the wrong API URL | Root `.env` build argument; rebuild the frontend image |
| Menu does not load during server rendering | Backend status and `INTERNAL_API_URL` in Compose |
| Database connection fails | MongoDB hostname and network access from inside the container |
| CORS errors | `FRONTEND_URL` matches the website origin |
| Google sign-in fails | OAuth credentials and registered callback URI |
| Image uploads fail | R2 bucket, credentials, and public domain |
| Port is already in use | Another process or container is using `3000` or `5000` |

This setup currently has two application containers only. It does not include a database container, reverse proxy, HTTPS termination, or health checks. Those would need to be configured separately for a production container deployment.
