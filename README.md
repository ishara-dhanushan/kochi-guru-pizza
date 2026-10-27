# Kochi Guru Pizza

Kochi Guru Pizza is a restaurant website built for Kochi Guru Pizza in Walasmulla, Sri Lanka. The site gives customers a place to browse the food and drinks menu, check item details and prices, see promotions, and find information about the restaurant. It also has customer registration and sign-in.

The repository includes the menu management side of the system as well. Instead of keeping menu items and prices in the frontend code, they are stored in a database and managed through a protected dashboard. Admin and staff accounts can add or update menu items, including their prices, descriptions, availability, and images. The public menu reads that data from the API, so changes do not require editing the page itself.

This is a full-stack TypeScript project with a **Next.js frontend** and an **Express API**. MongoDB stores the application data, while Cloudflare R2 is used for menu images. Authentication supports email/password and Google sign-in, with different permissions for customers, staff, and admins.

The public website and menu management features are the main working parts of the project. Some dashboard pages are still placeholders. **Online ordering, payment, and checkout are not implemented at this stage.**

Website: [kochigurupizza.com](https://kochigurupizza.com)

## Tech stack

| Area           | Technology                                    | Used for                                      |
| -------------- | --------------------------------------------- | --------------------------------------------- |
| Frontend       | Next.js 16, React 19, TypeScript              | Website, routing, rendering, and dashboard    |
| Styling        | Tailwind CSS 4, Framer Motion                 | Layout, styling, and animations               |
| UI             | Embla Carousel, Lucide React, React Hot Toast | Carousels, icons, and feedback messages       |
| Backend        | Node.js, Express 5, TypeScript                | REST API and business logic                   |
| Database       | MongoDB, Mongoose                             | User and menu records                         |
| Authentication | Passport.js, JWT, Google OAuth 2.0            | Sign-in, token handling, and protected routes |
| File storage   | Cloudflare R2, AWS S3 SDK                     | Menu image storage                            |
| Validation     | Zod                                           | API request validation                        |
| Code quality   | ESLint, Prettier                              | Linting and formatting                        |
| CI             | GitHub Actions                                | Checks on pushes and pull requests            |

## How the project works

The frontend and backend are separate applications in the same repository. They have their own dependencies, scripts, and environment files.

```text
                         Kochi Guru Pizza website
                                   |
                                   v
                     Next.js frontend (frontend/)
                       |                       |
           Browser-side API calls      Server-side menu fetching
                       |                       |
                       +-----------+-----------+
                                   |
                              REST API /v1
                                   |
                                   v
                        Express API (backend/)
                       /           |           \
                      /            |            \
                 MongoDB     Google OAuth     Cloudflare R2
              users + menu    sign-in flow     menu images
```

The public menu is fetched from the API and grouped by category. The backend stores both flat-priced products and products with size-based prices (for example, small, medium, and large pizzas). Each item can have multiple image URLs, a sort order, and an availability flag.

For authentication, the backend handles password verification, JWT access tokens, refresh-token rotation, and Google OAuth. Protected API endpoints check the signed-in user and their role before allowing changes. The frontend has separate HTTP clients for browser requests and server-side requests.

### What is available now

| Part           | Current functionality                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| Public site    | Home page, promotional content, menu, item details, about and contact pages           |
| Accounts       | Registration, email/password sign-in, Google sign-in, logout, current-user endpoint   |
| Menu dashboard | Create and update items, search/filter items, change availability, manage images      |
| Access control | Staff/admin permission checks for menu updates; admin-only delete and image endpoints |
| Backend        | Auth, menu, and image APIs under `/v1`                                                |

Dashboard routes for orders, analytics, promotions, staff, store, and settings currently show a **Coming Soon** page. They should not be treated as completed modules.

## Repository structure

```text
kochi-guru-pizza/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Frontend and backend CI checks
├── backend/
│   ├── src/
│   │   ├── config/                # App config, MongoDB, Passport
│   │   ├── controllers/           # Request handlers
│   │   ├── middleware/            # Authentication, roles, validation
│   │   ├── models/                # Mongoose schemas
│   │   ├── routes/                # Auth, menu, image endpoints
│   │   ├── schemas/               # Zod request schemas
│   │   ├── services/              # Cloudflare R2 operations
│   │   └── server.ts              # Express app entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json
├── frontend/
│   ├── public/                    # Static assets and menu imagery
│   ├── src/
│   │   ├── app/                   # Next.js App Router pages/layouts
│   │   ├── components/            # Shared website/dashboard components
│   │   ├── contexts/              # Auth and theme providers
│   │   ├── lib/                   # Browser/server HTTP clients
│   │   ├── services/              # API-facing functions
│   │   └── types/                 # TypeScript interfaces and types
│   ├── package.json
│   └── next.config.ts
└── README.md
```

There is **no root `package.json`**. The frontend and backend are installed and run separately. The structure above shows the active application folders rather than every file in the repository.

## Local development

### Requirements

- **Node.js 24 or later** and npm
- A running **MongoDB** database, either local or MongoDB Atlas
- A **Google Cloud OAuth client** with a client ID and secret
- A **Cloudflare R2 bucket** with API credentials and a public domain

The backend validates its Google OAuth and R2 environment variables during startup. It will not start if these are missing, even when you only want to work on parts of the site that do not use those services.

### 1. Clone the repository and install dependencies

These commands work in Windows PowerShell and Linux Bash:

```bash
git clone https://github.com/ishara-dhanushan/kochi-guru-pizza.git
cd kochi-guru-pizza

# Install backend dependencies
cd backend
npm ci

# Install frontend dependencies
cd ../frontend
npm ci

# Return to the repository root
cd ..
```

`npm ci` installs from each application's lockfile. Use `npm install` in the relevant directory when intentionally adding or updating dependencies.

### 2. Set up the backend environment

Create **`backend/.env`** with the following values:

```dotenv
# Server and database
PORT=5000
NODE_ENV=development
MONGO_DB_URI=mongodb://127.0.0.1:27017/kochi-guru-pizza
FRONTEND_URL=http://localhost:3000

# Authentication
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=replace-with-a-different-long-random-secret
REFRESH_TOKEN_EXPIRES_IN=30d
MAX_ACTIVE_SESSIONS=5

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/v1/auth/google/callback

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_DOMAIN=https://your-r2-public-domain.example
```

Update `MONGO_DB_URI` if you are using MongoDB Atlas. For Google sign-in, register `http://localhost:5000/v1/auth/google/callback` as an **authorized redirect URI** in Google Cloud Console. The callback URL must match exactly.

`R2_PUBLIC_DOMAIN` should be the base URL used to access uploaded images, without a trailing slash. The secret values above are examples only; generate your own long, unrelated JWT and refresh-token secrets. Do not commit real credentials.

### 3. Set up the frontend environment

Create **`frontend/.env.local`**:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/v1
INTERNAL_API_URL=http://localhost:5000/v1
```

`NEXT_PUBLIC_API_URL` is used by code running in the browser. `INTERNAL_API_URL` is preferred by the server-side HTTP client used in Next.js. They can use the same address during normal local development. Both URLs should include the `/v1` API prefix.

### 4. Start the applications

Start MongoDB first, then run each application in its own terminal from the repository root.

**Terminal 1 — backend**

```bash
cd backend
npm run dev
```

**Terminal 2 — frontend**

```bash
cd frontend
npm run dev
```

| Service      | Local URL                                                      |
| ------------ | -------------------------------------------------------------- |
| Website      | [http://localhost:3000](http://localhost:3000)                 |
| Backend root | [http://localhost:5000](http://localhost:5000)                 |
| Menu API     | [http://localhost:5000/v1/menu](http://localhost:5000/v1/menu) |

The backend uses `tsx watch` in development, while Next.js uses its own development server. Changes to either application are picked up by its respective process.

### 5. Check the API

Once the backend is running, you can check the public menu endpoint without signing in.

**Windows PowerShell**

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/v1/menu"
```

**Linux Bash**

```bash
curl http://localhost:5000/v1/menu
```

The endpoint returns menu data from MongoDB. An empty menu is possible if you have not added any items yet.

## Available npm commands

Run these commands from inside `frontend/` or `backend/`, depending on which application you are working on. For example, from the repository root:

```bash
cd frontend
```

For the backend, use `cd backend` instead. Both directories have their own `package.json` and `package-lock.json` files. The same npm commands are available in both applications:

| Command                | Purpose                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| `npm ci`               | Install dependencies from `package-lock.json`                                    |
| `npm run dev`          | Start the development server (Next.js in `frontend/`, `tsx watch` in `backend/`) |
| `npm run build`        | Create a production build (Next.js build or TypeScript compilation with linting) |
| `npm run start`        | Start the built application                                                      |
| `npm run lint`         | Run ESLint                                                                       |
| `npm run format:check` | Check Prettier formatting without changing files                                 |
| `npm run format`       | Format files with Prettier                                                       |

Run `npm run build` before `npm run start`. There is no automated `test` script defined in either application's current `package.json`. The repository's CI checks formatting, linting, and builds, but does not currently run a test suite.

## Backend API

All API endpoints are mounted under `/v1`. For local development, the base URL is `http://localhost:5000/v1`.

### Authentication

| Method | Endpoint                | Access                       |
| ------ | ----------------------- | ---------------------------- |
| `POST` | `/auth/register`        | Public                       |
| `POST` | `/auth/login`           | Public                       |
| `POST` | `/auth/refresh`         | Valid refresh token required |
| `POST` | `/auth/logout`          | Authenticated                |
| `GET`  | `/auth/me`              | Authenticated                |
| `GET`  | `/auth/google`          | Starts Google sign-in        |
| `GET`  | `/auth/google/callback` | Google OAuth callback        |

The API uses bearer access tokens for protected requests:

```http
Authorization: Bearer <access_token>
```

Refresh tokens are tracked against the user's record in MongoDB and replaced when refreshed. The backend also limits how many refresh tokens are retained for a user through `MAX_ACTIVE_SESSIONS`.

### Menu management

| Method   | Endpoint    | Access         |
| -------- | ----------- | -------------- |
| `GET`    | `/menu`     | Public         |
| `GET`    | `/menu/:id` | Public         |
| `POST`   | `/menu`     | Admin or staff |
| `PUT`    | `/menu/:id` | Admin or staff |
| `DELETE` | `/menu/:id` | Admin only     |

Menu records include a name, category, description fields, availability, image URLs, and sort order. Pricing supports either a single `price` or a list of size/price `variants`. Input is checked by the Zod schemas in `backend/src/schemas/` before the controller processes it.

### Images

| Method   | Endpoint          | Access     |
| -------- | ----------------- | ---------- |
| `POST`   | `/images`         | Admin only |
| `DELETE` | `/images`         | Admin only |
| `POST`   | `/images/cleanup` | Admin only |

Images are uploaded to Cloudflare R2. The upload endpoint accepts a multipart field named `file`, supports JPEG/PNG/WebP, and has a **5 MB file-size limit**. Image URLs are referenced by menu records in MongoDB; the files themselves are not stored in the database.

The cleanup endpoint checks for R2 objects that are not referenced by menu items. It runs in **dry-run mode by default**. Review the results before requesting actual deletion.

## CI and code checks

The workflow at [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs for pushes to `main` and pull requests targeting `main`. Frontend and backend checks run as separate jobs using **Node.js 24**.

Both jobs install dependencies, check Prettier formatting, run ESLint, and create a production build. To run the same checks locally, use the following commands from the repository root.

**Frontend:**

```bash
cd frontend
npm run format:check
npm run lint
npm run build
```

**Backend:**

```bash
cd backend
npm run format:check
npm run lint
npm run build
```

## Deployment notes

The frontend can be deployed as a Next.js application. The backend contains a [`vercel.json`](backend/vercel.json) configuration for running the Express API on Vercel. They can be deployed as two projects using `frontend/` and `backend/` as their respective project root directories.

Set the same required environment variables in the deployment platform. Pay particular attention to the URLs:

- `NEXT_PUBLIC_API_URL` must use the deployed backend URL **including `/v1`**.
- `FRONTEND_URL` must match the public frontend origin allowed by CORS.
- `GOOGLE_CALLBACK_URL` must point to the deployed backend callback and also be registered in Google Cloud Console.
- `INTERNAL_API_URL`, if set, needs to be reachable from the frontend's server-side runtime.
- MongoDB and Cloudflare R2 must be accessible from the backend deployment.

For Next.js, `NEXT_PUBLIC_` variables are included in the browser build, so use the intended API URL when building the production frontend.

## Troubleshooting

| Problem                    | What to check                                                        |
| -------------------------- | -------------------------------------------------------------------- |
| Backend exits on startup   | Required values in `backend/.env`; the error lists missing variables |
| MongoDB connection fails   | Connection string, database availability, and network access         |
| Menu is empty              | Backend logs, MongoDB contents, and the `/v1/menu` API response      |
| Browser requests fail      | `NEXT_PUBLIC_API_URL` and `/v1` prefix                               |
| Server-rendered menu fails | `INTERNAL_API_URL` (if set) and backend reachability                 |
| CORS error                 | `FRONTEND_URL` matches the browser's frontend origin                 |
| Google sign-in fails       | OAuth client credentials and exact authorized callback URL           |
| Image uploads fail         | R2 credentials, bucket permissions, and public domain                |
| `npm run start` fails      | Build the appropriate application first                              |

## Making changes

Work on a branch and open a pull request to `main`. Run the relevant formatting, lint, and build checks before pushing. If the change affects the API, update the frontend service and TypeScript types as needed so both applications stay in sync.

Do not commit `.env` files, access tokens, or service credentials.
