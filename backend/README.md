Setup

1. Copy `.env.example` to `.env` and update values. For local testing you can use the example credentials:

- ADMIN_EMAIL=admin@example.com
- ADMIN_PASSWORD=Admin123!

2. Install deps and run:

```bash
npm install
npm run dev
```

The server will seed an admin user on startup if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set.
