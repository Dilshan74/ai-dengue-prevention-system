# Server setup

The backend is an Express API backed by MongoDB. From the `Server` directory:

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set the values for your environment.
3. Start MongoDB, then run `npm run dev` for local development.

The API listens on port `5000` by default, and the Vite client normally runs on
`http://localhost:5173`. Set `CORS_ORIGIN` to the allowed frontend origin(s);
multiple origins can be separated by commas. `CLIENT_URL` is used to build
password-reset links. Email-based password reset also requires `EMAIL_USER` and
`EMAIL_PASS`.

For production, set `NODE_ENV=production`, a MongoDB connection string in
`MONGO_URI`, an explicit frontend origin in `CORS_ORIGIN`, and a random
`JWT_SECRET` of at least 32 characters. Production startup fails if these are
missing or the JWT secret is too short. Keep real credentials in deployment
environment settings or a local `.env`; never commit them.

`SEED_PASSWORD` is only needed when running `npm run seed`. The seed script
clears existing application data, so use it only with a disposable development
database.