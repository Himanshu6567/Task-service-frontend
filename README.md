# UrbanAssist: Neighborhood Services Finder

UrbanAssist is a neighborhood services marketplace. Customers can discover local service providers, send service requests, manage bookings, and communicate with providers. Providers can create a profile, manage incoming work, and chat with customers. The project also includes an administration dashboard for reviewing platform data.

## Features

- Customer and service-provider registration and login, with role-based pages.
- Signup email verification using one-time passwords.
- Browse service categories and find providers by category and location.
- Submit service requests and manage bookings; providers can accept or reject requests.
- Customer/provider conversations and chat messages.
- Real-time Socket.IO events for request and chat updates.
- Provider profile and image handling through Cloudinary.
- Feedback and ratings display.
- Admin login, dashboard summaries, and user/provider deletion.
- Geolocation and map-related UI for location-aware discovery.
- Contact form and SMTP-based email delivery.

## Technology

- **Client:** Next.js 15, React 18, Tailwind CSS, Axios, Lucide icons.
- **Server logic:** Node.js and Express; Next.js forwards API requests to the Express server.
- **Database:** MongoDB with Mongoose.
- **Real-time:** Socket.IO.
- **Uploads:** Cloudinary.
- **Email:** Brevo transactional HTTPS API in production, with Nodemailer SMTP available as a fallback.

## Repository Layout

```text
Client/
	app/                 Next.js pages, components, and API route handler
	lib/                 Client/server helpers
	public/              Static images and assets
	server.js            Custom Next.js + Socket.IO development/production server
Server/
	Controller/          Request handlers and business logic
	Models/              Mongoose models
	routes/              Express route definitions
	services/            Authentication and email helpers
	index.js             Standalone Express API server
	socket.js            Socket.IO server setup
	seed-demo-data.js    Optional demo-data seeder
```

The normal Next.js API endpoint is `Client/app/api/[...path]/route.js`. It forwards API requests to the Express server configured by `BACKEND_URL` (or `NEXT_PUBLIC_BACKEND_URL`). `Server/index.js` exposes all application endpoints, including admin and session routes. `Client/server.js` runs Next.js and Socket.IO on the same HTTP server for deployments that use the custom server.

## Requirements

- Node.js (use a current LTS release) and npm.
- A MongoDB database, local or hosted (for example, MongoDB Atlas).
- Cloudinary credentials for provider image uploads.
- An email sender account for signup OTP and other email features. Brevo's free transactional email plan can be used through its HTTPS API; SMTP is also supported on hosts that allow outbound SMTP.

## Local Setup

Install dependencies in both package directories:

```powershell
Set-Location .\Server
npm install

Set-Location ..\Client
npm install
```

Create `Server/.env` for local development. Do not commit real credentials:

```dotenv
mongooseConnectionString=<mongodb-connection-string>
jwt_secretKay=<long-random-secret>

cloudinary_cloud_name=<cloudinary-cloud-name>
cloudinary_api_key=<cloudinary-api-key>
cloudinary_api_secret=<cloudinary-api-secret>

SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USER=<smtp-username>
SMTP_PASS=<smtp-password>
SMTP_FROM=<verified-sender-address>
SMTP_SECURE=false

clientOrigin=http://localhost:3000
NEXT_PORT=3000
PORT=8000
```

`SMTP_PORT` defaults to `587`. Use `SMTP_SECURE=true` for an implicit-TLS SMTP connection, commonly on port `465`. `PORT` is used by the standalone Express server in `Server/index.js`; `NEXT_PORT` is used by the custom Next.js server in `Client/server.js`.

Set the backend URL in `Client/.env.local` for local development:

```dotenv
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Start the Express API and frontend in separate terminals:

```powershell
Set-Location .\Server
node index.js
```

```powershell
Set-Location .\Client
npm run dev
```

Open `http://localhost:3000`. Frontend requests use same-origin `/api/...`
paths, which Next.js forwards to the configured backend URL. Restart the
frontend after changing its environment file. For Vercel, set
`NEXT_PUBLIC_BACKEND_URL` to the public Render service URL in the Vercel
project environment settings, then redeploy.

Signup OTP generation, storage, and delivery all run in the Render backend.
For Render Free, configure `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, and optionally
`BREVO_FROM_NAME` in the Render service environment. Verify the sender in Brevo;
for reliable delivery, authenticate a domain you own using Brevo's DNS records.
Brevo's free plan has a daily sending limit. When `BREVO_API_KEY` is present,
the backend sends email through Brevo's HTTPS API. Without it, the backend can
use the SMTP settings below (the local `Server/.env` is not uploaded to Render).
Render Free blocks outbound SMTP ports 25, 465, and 587, so Gmail SMTP requires
a paid Render instance or a backend host that permits those ports.

For local SMTP, use `SMTP_HOST=smtp.gmail.com`, port `587`, and
`SMTP_SECURE=false` (or port `465` and `SMTP_SECURE=true`). If both Brevo and
SMTP are configured, Brevo is selected.

Admin credentials can be configured on Render with `ADMIN_EMAIL` and
`ADMIN_PASSWORD`. If unset, the current defaults are `Admin@gmail.com` and
`123456789`.

## Commands

Run these from the directory shown:

| Directory | Command             | Purpose                                                   |
| --------- | ------------------- | --------------------------------------------------------- |
| `Client/` | `npm run dev`       | Start the Next.js and Socket.IO development server.       |
| `Client/` | `npm run build`     | Create a production Next.js build.                        |
| `Client/` | `npm start`         | Start the custom server in production mode. Build first.  |
| `Client/` | `npm run lint`      | Run ESLint.                                               |
| `Server/` | `node index.js`     | Start the standalone Express API server; requires `PORT`. |
| `Server/` | `npm run seed:demo` | Add/update demo categories and providers.                 |

There is currently no database migration command or migration framework. The `Server/` test script is a placeholder and does not run an application test suite.

## Demo Data Warning

The seeder is intended only for a database where demo records are appropriate. It upserts four service categories and four demo providers. It also deletes service-category records whose titles are not in its demo list and removes several specifically named old demo providers. **Do not run `npm run seed:demo` against production unless you have reviewed those effects and want them.** Back up important data before changing production databases.

To run the seeder, make sure `mongooseConnectionString` points to the intended database, then run:

```powershell
Set-Location .\Server
npm run seed:demo
```

## Production Deployment Notes

- Configure the environment variables in the hosting provider's secret/environment settings; do not upload or commit `Server/.env`.
- The application needs a persistent Node.js server for its current same-origin Socket.IO setup. Vercel's serverless functions do not run the custom server as a persistent WebSocket server. To use Vercel, host Socket.IO separately on a persistent service and update the client socket connection to use that service.
- The Next.js API route imports controller code from the sibling `Server/` directory and the database helper loads Mongoose from `Server/node_modules`. A deployment must include and resolve those sibling files/dependencies; verify the production build and API routes in the target platform, not only locally.
- Configure MongoDB network access for the deployed server and use a production database user with only the permissions the app requires.
- Set strong `ADMIN_EMAIL` and `ADMIN_PASSWORD` values before exposing the application publicly, along with a strong JWT secret.
- Confirm Cloudinary and SMTP configuration with production credentials, and set `clientOrigin` to the deployed origin when using the standalone Socket.IO server.
- Run database setup/seed operations as a deliberate one-off task, not automatically as part of every build or deployment.

## Security

- Keep `.env` files, database URLs, SMTP passwords, and Cloudinary secrets out of source control.
- Use HTTPS in production so authentication cookies are sent securely.
- Change the source-defined admin credentials before production deployment.
- Review authorization, upload limits, CORS origins, and production database access before opening the service to users.

## License

No project license is currently documented in this repository. Add a license file and update this section if you intend to distribute the project under specific terms.
