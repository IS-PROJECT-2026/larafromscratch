<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>Assignment Tracker</title>

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body>
        <main class="tracker-page" id="assignment-tracker">
            <section class="tracker-shell">
                <header class="tracker-header">
                    <div>
                        <p class="tracker-kicker">{{ auth()->user()->name }}'s workspace</p>
                        <h1>Assignment Tracker</h1>
                        <p class="tracker-subtitle">Capture coursework, stay ahead of deadlines, and check work off fast.</p>
                    </div>
                    <div class="tracker-account">
                        <a href="{{ route('profile.edit') }}">Account</a>
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit">Log out</button>
                        </form>
                    </div>
                </header>

                <section class="tracker-progress" aria-labelledby="progress-label">
                    <div class="tracker-progress-copy">
                        <span id="progress-label">Visible work completed</span>
                        <strong id="assignment-progress-text">0 of 0 (0%)</strong>
                    </div>
                    <div class="tracker-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-labelledby="progress-label">
                        <span id="assignment-progress-bar" class="tracker-progress-bar"></span>
                    </div>
                </section>

                <form id="assignment-form" class="tracker-form" novalidate>
                    <label class="tracker-field tracker-title-field">
                        <span>Title</span>
                        <input id="assignment-title" name="title" type="text" maxlength="120" placeholder="e.g., Chapter 5 Problem Set" required>
                    </label>

                    <label class="tracker-field">
                        <span>Course</span>
                        <input id="assignment-course" name="course" type="text" maxlength="80" placeholder="e.g., Calculus II" required>
                    </label>

                    <label class="tracker-field">
                        <span>Due date</span>
                        <input id="assignment-due-date" name="dueDate" type="date" required>
                    </label>

                    <label class="tracker-field">
                        <span>Priority</span>
                        <select id="assignment-priority" name="priority" required>
                            <option value="high">High</option>
                            <option value="medium" selected>Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </label>

                    <button type="submit" class="tracker-submit">Add assignment</button>
                </form>

                <p id="assignment-form-error" class="tracker-error" role="alert" aria-live="polite"></p>

                <section class="tracker-tools" aria-label="Assignment display controls">
                    <label class="tracker-field tracker-search-field">
                        <span>Search</span>
                        <input id="assignment-search" type="search" placeholder="Search title or course">
                    </label>
                    <label class="tracker-field tracker-course-filter">
                        <span>Course</span>
                        <select id="assignment-course-filter">
                            <option value="">All courses</option>
                        </select>
                    </label>
                    <div class="tracker-view-toggle" role="group" aria-label="Choose a view">
                        <button type="button" class="tracker-view-button is-active" data-view="list" aria-pressed="true">List</button>
                        <button type="button" class="tracker-view-button" data-view="calendar" aria-pressed="false">Calendar</button>
                    </div>
                </section>

                <p id="assignment-load-error" class="tracker-error" role="alert" aria-live="polite"></p>

                <section id="assignment-list-view" class="tracker-list-wrap" aria-live="polite">
                    <ul id="assignment-list" class="tracker-list"></ul>
                    <p id="assignment-empty-state" class="tracker-empty">No assignments yet. Add your first one above.</p>
                </section>

                <section id="assignment-calendar-view" class="tracker-calendar" hidden>
                    <header class="calendar-header">
                        <button id="calendar-previous" type="button" class="calendar-nav" aria-label="Previous month">←</button>
                        <h2 id="calendar-month" aria-live="polite"></h2>
                        <button id="calendar-next" type="button" class="calendar-nav" aria-label="Next month">→</button>
                    </header>
                    <div class="calendar-weekdays" aria-hidden="true">
                        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                    </div>
                    <div id="assignment-calendar-grid" class="calendar-grid" role="grid" aria-labelledby="calendar-month"></div>
                </section>
            </section>
        </main>
    </body>
</html>
