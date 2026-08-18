<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="{{ auth()->user()->theme_preference }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>Planner</title>

        <script>
            (() => {
                const preference = document.documentElement.dataset.theme || 'system';
                const resolved = preference === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : preference;
                document.documentElement.dataset.resolvedTheme = resolved;
            })();
        </script>
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body>
        <main class="planner" id="assignment-tracker">
            <aside class="planner-sidebar" aria-label="Planner navigation">
                <a class="planner-brand" href="{{ route('dashboard') }}" aria-label="Planner home">
                    <span class="planner-brand-mark" aria-hidden="true">P</span>
                    <span>Planner</span>
                </a>

                <nav class="planner-nav" aria-label="Views">
                    <button class="planner-nav-button is-active" type="button" data-screen="calendar" aria-pressed="true">
                        <span aria-hidden="true">▦</span> Calendar
                    </button>
                    <button class="planner-nav-button" type="button" data-screen="agenda" aria-pressed="false">
                        <span aria-hidden="true">☰</span> Agenda
                    </button>
                </nav>

                <section class="planner-sidebar-section" aria-labelledby="courses-label">
                    <p id="courses-label" class="sidebar-label">Courses</p>
                    <label class="sr-only" for="assignment-course-filter">Filter by course</label>
                    <select id="assignment-course-filter" class="sidebar-select">
                        <option value="">All courses</option>
                    </select>
                </section>

                <section class="planner-sidebar-section planner-workload" aria-labelledby="workload-label">
                    <p id="workload-label" class="sidebar-label">This month</p>
                    <strong id="month-workload">0h planned</strong>
                    <span id="month-task-count">0 assignments</span>
                </section>

                <div class="planner-account">
                    <span>{{ auth()->user()->name }}</span>
                    <a href="{{ route('profile.edit') }}">Account</a>
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button type="submit">Log out</button>
                    </form>
                </div>
            </aside>

            <section class="planner-main">
                <header class="planner-topbar">
                    <div class="planner-month-controls">
                        <button id="calendar-previous" class="icon-button" type="button" aria-label="Previous month" title="Previous month">‹</button>
                        <button id="calendar-today" class="quiet-button" type="button">Today</button>
                        <button id="calendar-next" class="icon-button" type="button" aria-label="Next month" title="Next month">›</button>
                        <h1 id="calendar-month" aria-live="polite"></h1>
                    </div>

                    <div class="planner-actions">
                        <label class="search-control">
                            <span class="sr-only">Search assignments</span>
                            <span aria-hidden="true">⌕</span>
                            <input id="assignment-search" type="search" placeholder="Search">
                        </label>
                        <a class="quiet-button export-button" href="{{ route('assignments.export') }}">Export CSV</a>
                        <div class="theme-switcher" role="group" aria-label="Color theme">
                            <button type="button" class="theme-button" data-theme-value="system" aria-label="Use system theme" title="System theme">▣</button>
                            <button type="button" class="theme-button" data-theme-value="light" aria-label="Use light theme" title="Light theme">☀</button>
                            <button type="button" class="theme-button" data-theme-value="dark" aria-label="Use dark theme" title="Dark theme">◐</button>
                        </div>
                        <button id="quick-add" class="primary-button" type="button">+ Add</button>
                    </div>
                </header>

                <p id="assignment-load-error" class="planner-error" role="alert" aria-live="polite"></p>

                <section id="calendar-screen" class="planner-content">
                    <section class="calendar-surface" aria-label="Assignment calendar">
                        <div class="calendar-weekdays" aria-hidden="true">
                            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                        </div>
                        <div id="assignment-calendar-grid" class="calendar-grid" role="grid" aria-labelledby="calendar-month"></div>
                    </section>

                    <aside class="agenda-panel" aria-labelledby="selected-date-heading">
                        <header class="agenda-header">
                            <div>
                                <p>Selected day</p>
                                <h2 id="selected-date-heading"></h2>
                            </div>
                            <button id="selected-day-add" class="icon-button" type="button" aria-label="Add assignment on selected day" title="Add assignment">+</button>
                        </header>
                        <div class="agenda-summary">
                            <span id="selected-date-count">0 assignments</span>
                            <strong id="selected-date-estimate">No study time planned</strong>
                        </div>
                        <ul id="selected-date-list" class="agenda-list"></ul>
                        <p id="selected-date-empty" class="agenda-empty">Nothing due on this day.</p>
                    </aside>
                </section>

                <section id="agenda-screen" class="agenda-screen" hidden aria-labelledby="agenda-heading">
                    <header class="agenda-screen-header">
                        <div>
                            <p class="eyebrow">Upcoming work</p>
                            <h2 id="agenda-heading">Agenda</h2>
                        </div>
                        <strong id="assignment-progress-text">0 of 0 complete</strong>
                    </header>
                    <ul id="assignment-list" class="assignment-list" aria-live="polite"></ul>
                    <p id="assignment-empty-state" class="agenda-empty">No assignments match your filters.</p>
                </section>
            </section>
        </main>

        <dialog id="assignment-dialog" class="planner-dialog" aria-labelledby="assignment-dialog-title">
            <form id="assignment-form" method="dialog" novalidate>
                <header class="dialog-header">
                    <div>
                        <p class="eyebrow" id="assignment-dialog-kicker">New assignment</p>
                        <h2 id="assignment-dialog-title">Add assignment</h2>
                    </div>
                    <button id="assignment-dialog-close" class="icon-button" type="button" aria-label="Close assignment dialog" title="Close">×</button>
                </header>

                <input id="assignment-id" type="hidden">
                <div class="dialog-fields">
                    <label class="form-field form-field-wide">
                        <span>Title</span>
                        <input id="assignment-title" type="text" maxlength="120" placeholder="Chapter 5 problem set" required>
                    </label>
                    <label class="form-field">
                        <span>Course</span>
                        <input id="assignment-course" type="text" maxlength="80" placeholder="Calculus II" required>
                    </label>
                    <label class="form-field">
                        <span>Due date</span>
                        <input id="assignment-due-date" type="date" required>
                    </label>
                    <label class="form-field">
                        <span>Priority</span>
                        <select id="assignment-priority" required>
                            <option value="high">High</option>
                            <option value="medium" selected>Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </label>
                    <label class="form-field">
                        <span>Study estimate</span>
                        <div class="input-suffix">
                            <input id="assignment-estimate" type="number" min="0" max="1000" step="0.25" inputmode="decimal" placeholder="0">
                            <span>hours</span>
                        </div>
                    </label>
                    <label id="assignment-completed-field" class="completion-field" hidden>
                        <input id="assignment-completed" type="checkbox">
                        <span>Completed</span>
                    </label>
                </div>
                <p id="assignment-form-error" class="planner-error" role="alert" aria-live="polite"></p>
                <footer class="dialog-footer">
                    <button id="assignment-delete" class="danger-button" type="button" hidden>Delete</button>
                    <span class="dialog-footer-spacer"></span>
                    <button id="assignment-dialog-cancel" class="quiet-button" type="button">Cancel</button>
                    <button class="primary-button" type="submit">Save assignment</button>
                </footer>
            </form>
        </dialog>
    </body>
</html>
