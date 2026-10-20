# Maya Requioma MarTech - Send Money Limits Module

A TypeScript + Express.js server with Sequelize ORM and PostgreSQL, containerized with Docker.

## Quick Start with Docker

### Prerequisites
- Docker
- Docker Compose

### Running the Application

1. **Start the services:**
   ```bash
   docker compose up --build
   ```

   This will:
   - Build the Node.js application image
   - Start a PostgreSQL database container
   - Start the application container
   - Wait for the database to be healthy before starting the app

2. **Verify the server is running:**
   ```bash
   curl http://localhost:3000/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "message": "Send Money Limits Module is running"
   }
   ```

3. **Stop the services:**
   ```bash
   docker compose down
   ```

   To also remove the database volume:
   ```bash
   docker compose down -v
   ```

## Local Development (without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 16+

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Update `.env` file:**
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=maya_martech
   DB_USER=postgres
   DB_PASSWORD=your_password
   PORT=3000
   NODE_ENV=development
   ```

3. **Build and run:**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run build` — Compile TypeScript to JavaScript
- `npm run dev` — Build and run locally
- `npm start` — Run compiled JavaScript
- `npm test` — Run tests

## Project Structure

```
src/
├── config/
│   └── database.ts          # Sequelize configuration
├── models/
│   └── User.ts              # Example User model
└── index.ts                 # Express server setup
```

## Docker Configuration

- **`Dockerfile`** — Builds the Node.js application
- **`docker-compose.yml`** — Orchestrates the app and PostgreSQL services
- **`.dockerignore`** — Excludes unnecessary files from the Docker image

The PostgreSQL container:
- Uses Alpine Linux (lightweight)
- Includes health checks
- Stores data in a named volume for persistence
- Exposes port 5432

## Environment Variables

| Variable | Default | Docker Value | Notes |
|----------|---------|--------------|-------|
| DB_HOST | localhost | postgres | Service name in docker-compose |
| DB_PORT | 5432 | 5432 | - |
| DB_NAME | maya_martech | maya_martech | - |
| DB_USER | postgres | postgres | - |
| DB_PASSWORD | password | password | Change in production |
| PORT | 3000 | 3000 | - |
| NODE_ENV | development | development | - |

## Assumptions and Scope

1. Basic authentication only for this app, log out, refresh token functionalities not included
2. Administrator role can perform CRUD operations for all users
3. User role can ONLY perform CRUD operations for their own records
4. Transaction lifecycle will only be COMPLETED and FAILED. Synchronous processing of transactions are being done.


## Brief Notes before Production Launch
[] Generate a separate JWT_SECRET_KEY for the production environment
[] Generate a different password for the database in the production environment
[] Remove hardcoded password for admin users in the seeders

