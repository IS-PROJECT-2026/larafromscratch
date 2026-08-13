# Assignment Tracker

A Laravel + Vite web app for tracking coursework assignments.

Day 1 MVP includes:

- Create assignments with title, course, and due date
- Display assignments in a list
- Mark assignments as complete or undo
- Delete assignments
- Persist data in browser localStorage

## Tech Stack

- PHP 8.3+
- Laravel 13
- Node.js 20+ and npm
- Vite + Tailwind CSS 4

## Routes

- `/` - Assignment Tracker app (primary)
- `/assignments` - Assignment Tracker app (alias)

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

5. Run database migrations.

```bash
php artisan migrate
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
- Tracker: http://127.0.0.1:8080/assignments

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

- Data is saved in browser localStorage (key: `assignment-tracker.items.v1`).
- Data is browser-specific and device-specific.
- Clearing browser storage will remove saved assignments.

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
