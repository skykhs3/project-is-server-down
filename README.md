# Is It Down? - KAIST SERVER Monitoring Service
## [kaist.vercel.app](https://kaist.vercel.app) OR [kaist.site](https://kaist.site)

A website monitoring service that checks the availability of websites and provides status updates.

Built with a modern tech stack using Turborepo for monorepo management.

![Demo](/demo.gif)

## Tech Stack

- **Frontend**: Next.js
- **Backend**: Node.js
- **Database**: MongoDB
- **Package Manager**: pnpm
- **Build Tool**: Turborepo
- **Containerization**: Docker

## Project Structure

```
.
├── apps/           # Application code
│   ├── api/        # API server
│   ├── web/        # Next.js frontend
│   └── cron/       # Background job service
├── packages/       # Shared packages
├── docker/         # Docker configuration
└── ...
```

## Prerequisites

- Node.js >= 22
- pnpm >= 9.0.0
- Docker and Docker Compose
- MongoDB (for local development)

## Environment Variables

### Root Level (.env)
```
# .env 파일
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=your-password
MONGO_INITDB_DATABASE=project-is-server-down
```

### API Service (apps/api/.env)
```
MONGODB_URI="mongodb://root:your-password@mongodb-dev:27017/project-is-server-down?authSource=admin"
```

### Web Service (apps/web/.env)
```
API_SERVER_URI="your_api_server_url"
```

### Cron Service (apps/cron/.env)
```
MONGODB_URI="mongodb://root:your-password@localhost:27017/project-is-server-down?authSource=admin"
```

## Development Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create environment files:
   ```bash
   # Create .env files for each service
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   cp apps/cron/.env.example apps/cron/.env
   ```

3. Start development servers:
   ```bash
   docker-compose up -d mongodb-dev
   pnpm dev
   ```

4. Available development scripts:
   - `pnpm build`: Build all packages
   - `pnpm dev`: Start development servers
   - `pnpm lint`: Run linting
   - `pnpm format`: Format code
   - `pnpm check-types`: Check TypeScript types

## Production Setup

1. Create a `.env` files
   ```bash
   # Create .env files for each service
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   cp apps/cron/.env.example apps/cron/.env
   ```

2. Start the services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Docker Services

- `api-dev`: Main API service
- `cron-dev`: Background job service for monitoring
- `mongodb-dev`: MongoDB database service

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
