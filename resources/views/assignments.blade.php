<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Assignment Tracker</title>

        @fonts

        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif
    </head>
    <body>
        <main class="tracker-page" id="assignment-tracker">
            <section class="tracker-shell">
                <header class="tracker-header">
                    <h1>Assignment Tracker</h1>
                    <p class="tracker-subtitle">Capture coursework, stay ahead of deadlines, and check work off fast.</p>
                </header>

                <form id="assignment-form" class="tracker-form" novalidate>
                    <label class="tracker-field">
                        <span>Title</span>
                        <input id="assignment-title" name="title" type="text" maxlength="120" placeholder="e.g., Chapter 5 Problem Set" required>
                    </label>

                    <label class="tracker-field">
                        <span>Course</span>
                        <input id="assignment-course" name="course" type="text" maxlength="80" placeholder="e.g., Calculus II" required>
                    </label>

                    <label class="tracker-field">
                        <span>Due Date</span>
                        <input id="assignment-due-date" name="dueDate" type="date" required>
                    </label>

                    <button type="submit" class="tracker-submit">Add Assignment</button>
                </form>

                <p id="assignment-form-error" class="tracker-error" role="alert" aria-live="polite"></p>

                <section class="tracker-list-wrap" aria-live="polite">
                    <ul id="assignment-list" class="tracker-list"></ul>
                    <p id="assignment-empty-state" class="tracker-empty">No assignments yet. Add your first one above.</p>
                </section>
            </section>
        </main>
    </body>
</html>
