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
- Node.js 20+ and npm
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

2. Install PHP dependencies.

```bash
composer install
```

3. Create environment file and app key.

```bash
cp .env.example .env
php artisan key:generate
```

4. Configure your database connection in `.env`.

5. Start Sail and run database migrations.

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate
```

6. Install frontend dependencies.

```bash
npm install
```

7. Start development servers (see next section).

## Quick Setup (One Command)

If your machine already has PHP, Composer, and Node/npm configured, you can run:

```bash
composer run setup
```

This project script installs backend and frontend dependencies, creates `.env` if missing, generates an app key, runs migrations, and builds frontend assets.

## Run in Development

Use one of the following options.

### Option A: Single Command (Recommended)

```bash
composer run dev
```

This delegates to Laravel's dev orchestration command and runs everything needed for local development.

### Option B: Two Terminals

Terminal 1 (Laravel server):

```bash
php artisan serve
```

Terminal 2 (Vite dev server):

```bash
npm run dev
```

Then open:

- App: http://127.0.0.1:8080
- Create an account at http://127.0.0.1:8080/register, then sign in to use the tracker.

## Build for Production-like Local Testing

```bash
npm run build
php artisan serve
```

This uses compiled assets from `public/build` instead of the Vite dev server.

## Run Tests

```bash
php artisan test
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
php artisan key:generate
```

3. Database migration errors:

- Check DB credentials in `.env`
- Re-run:

```bash
php artisan migrate
```

4. Frontend build issues:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## License

MIT
