# Assignment Tracker

A Laravel + Vite web app for tracking coursework assignments.

The tracker includes:

- Laravel Breeze registration, login, logout, password reset, and profile screens
- Per-user assignments persisted in Sail MySQL
- Create assignments with title, course, due date, and High/Medium/Low priority
- Course filtering, title/course search, deadline-first list order, and completion progress
- Navigable monthly calendar and red overdue indicators for incomplete past-due work
- Responsive list and calendar views

## Tech Stack

- PHP 8.3+
- Laravel 13
- Node.js and npm
- Vite + Tailwind CSS 4

## Routes

- `/` - authenticated Assignment Tracker app
- `/assignments` - authenticated assignment JSON API (`GET`, `POST`, `PATCH /{id}`, `DELETE /{id}`)
- `/register`, `/login`, `/forgot-password` - account screens

## Fresh Machine Setup

1. Clone the repository and enter it.

```bash
git clone <your-repo-url>
cd larafromscratch
```

2. Run one-time setup.

```bash
./setup.sh
```

For unattended provisioning:

```bash
./setup.sh --non-interactive
```

This setup script:

- installs system prerequisites on Ubuntu/Debian (`php`, `composer`, `node`, `npm`, `docker`, `docker compose`)
- installs backend and frontend dependencies
- creates `.env` if missing
- configures a permanent `sail` shell helper in your `~/.bashrc`
- starts Sail and runs pending migrations

Notes:

- The script may prompt for your `sudo` password when installing system packages.
- `--non-interactive` requires passwordless sudo (or running as root).
- If Docker group membership is added during setup, log out and back in once.
- Non-Ubuntu/Debian machines should install prerequisites manually, then rerun `./setup.sh`.

## Quick Setup (One Command)

If your machine already has PHP, Composer, and Node/npm configured, you can run:

```bash
./setup.sh
```

This setup is idempotent and safe to re-run.

## Run in Development

### Daily Commands

1. Start Sail services:

```bash
sail up -d
```

2. Start frontend dev server:

```bash
npm run dev
```

3. Run common Laravel commands:

```bash
sail artisan migrate
sail artisan test
sail artisan queue:work
```

After setup, open a new terminal (or run `source ~/.bashrc`) and use Sail commands directly:

```bash
sail up -d
sail down
sail artisan migrate
```

Use npm from your host terminal:

```bash
npm run dev
```

Then open:

- App: http://127.0.0.1:8080
- Create an account at http://127.0.0.1:8080/register, then sign in to use the tracker.

## Build for Production-like Local Testing

```bash
npm run build
sail up -d
```

This uses compiled assets from `public/build` instead of the Vite dev server.

## Run Tests

```bash
sail artisan test
```

## Assignment Tracker Notes

- Assignments are stored in the Sail MySQL database and belong to the signed-in user.
- Existing browser localStorage data is intentionally not imported.

## Common Troubleshooting

1. Styles or JS not updating in dev:

```bash
npm run dev
```

2. App key missing:

```bash
sail artisan key:generate
```

3. Database migration errors:

- Check DB credentials in `.env`
- Re-run:

```bash
sail artisan migrate
```

4. Frontend build issues:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## License

MIT
