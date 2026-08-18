const ASSIGNMENTS_URL = '/assignments';
const THEME_URL = '/preferences/theme';
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function dateFromString(value) {
    return new Date(`${value}T00:00:00`);
}

function formatDate(value, options = { month: 'short', day: 'numeric' }) {
    const date = dateFromString(value);

    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, options).format(date);
}

function formatHours(minutes) {
    if (!minutes) return 'No study time planned';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (!hours) return `${remainingMinutes}m remaining`;
    return `${hours}h${remainingMinutes ? ` ${remainingMinutes}m` : ''} remaining`;
}

function relativeDueDate(value) {
    const today = dateFromString(localDateString());
    const dueDate = dateFromString(value);
    const difference = Math.round((dueDate - today) / 86400000);

    if (difference < 0) return `${Math.abs(difference)}d overdue`;
    if (difference === 0) return 'Due today';
    if (difference === 1) return 'Due tomorrow';
    return `Due in ${difference} days`;
}

function isOverdue(assignment) {
    return !assignment.completed && assignment.dueDate < localDateString();
}

function sortAssignments(assignments) {
    return [...assignments].sort((a, b) =>
        a.dueDate.localeCompare(b.dueDate) || new Date(a.createdAt) - new Date(b.createdAt),
    );
}

async function request(url, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        let message = 'Something went wrong. Please try again.';
        try {
            const body = await response.json();
            message = body.message || Object.values(body.errors || {}).flat()[0] || message;
        } catch {
            // A failed response does not always include a JSON payload.
        }
        throw new Error(message);
    }

    return response.status === 204 ? null : response.json();
}

function initAssignmentTracker() {
    const root = document.getElementById('assignment-tracker');
    if (!root) return;

    const refs = {
        calendarMonth: document.getElementById('calendar-month'),
        calendarGrid: document.getElementById('assignment-calendar-grid'),
        previousMonth: document.getElementById('calendar-previous'),
        nextMonth: document.getElementById('calendar-next'),
        today: document.getElementById('calendar-today'),
        courseFilter: document.getElementById('assignment-course-filter'),
        search: document.getElementById('assignment-search'),
        monthWorkload: document.getElementById('month-workload'),
        monthTaskCount: document.getElementById('month-task-count'),
        selectedDateHeading: document.getElementById('selected-date-heading'),
        selectedDateCount: document.getElementById('selected-date-count'),
        selectedDateEstimate: document.getElementById('selected-date-estimate'),
        selectedDateList: document.getElementById('selected-date-list'),
        selectedDateEmpty: document.getElementById('selected-date-empty'),
        agendaList: document.getElementById('assignment-list'),
        agendaEmpty: document.getElementById('assignment-empty-state'),
        progressText: document.getElementById('assignment-progress-text'),
        calendarScreen: document.getElementById('calendar-screen'),
        agendaScreen: document.getElementById('agenda-screen'),
        screenButtons: document.querySelectorAll('[data-screen]'),
        quickAdd: document.getElementById('quick-add'),
        selectedDayAdd: document.getElementById('selected-day-add'),
        dialog: document.getElementById('assignment-dialog'),
        form: document.getElementById('assignment-form'),
        formError: document.getElementById('assignment-form-error'),
        loadError: document.getElementById('assignment-load-error'),
        dialogKicker: document.getElementById('assignment-dialog-kicker'),
        dialogTitle: document.getElementById('assignment-dialog-title'),
        dialogClose: document.getElementById('assignment-dialog-close'),
        dialogCancel: document.getElementById('assignment-dialog-cancel'),
        assignmentId: document.getElementById('assignment-id'),
        title: document.getElementById('assignment-title'),
        course: document.getElementById('assignment-course'),
        dueDate: document.getElementById('assignment-due-date'),
        priority: document.getElementById('assignment-priority'),
        estimate: document.getElementById('assignment-estimate'),
        completed: document.getElementById('assignment-completed'),
        completedField: document.getElementById('assignment-completed-field'),
        delete: document.getElementById('assignment-delete'),
        themeButtons: document.querySelectorAll('[data-theme-value]'),
    };

    let assignments = [];
    let activeScreen = 'calendar';
    let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    let selectedDate = localDateString();

    const visibleAssignments = () => {
        const term = refs.search.value.trim().toLocaleLowerCase();
        const course = refs.courseFilter.value;

        return sortAssignments(assignments.filter((assignment) => {
            const matchesCourse = !course || assignment.course === course;
            const haystack = `${assignment.title} ${assignment.course}`.toLocaleLowerCase();
            return matchesCourse && (!term || haystack.includes(term));
        }));
    };

    const assignmentButton = (assignment, className = 'agenda-assignment-button') => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.dataset.editId = assignment.id;

        const row = document.createElement('span');
        row.className = 'assignment-title-row';
        const title = document.createElement('span');
        title.className = 'assignment-title';
        title.textContent = assignment.title;
        const badge = document.createElement('span');
        badge.className = `assignment-badge priority-${assignment.priority}`;
        badge.textContent = PRIORITY_LABELS[assignment.priority];
        row.append(title, badge);

        const meta = document.createElement('span');
        meta.className = 'assignment-meta';
        const studyEstimate = assignment.estimatedMinutes ? ` · ${formatHours(assignment.estimatedMinutes)}` : '';
        meta.textContent = `${assignment.course} · ${relativeDueDate(assignment.dueDate)}${studyEstimate}`;
        button.append(row, meta);

        return button;
    };

    const actionButton = (assignment) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'task-action';
        button.dataset.toggleId = assignment.id;
        button.textContent = assignment.completed ? 'Undo' : 'Complete';
        return button;
    };

    const renderCourseFilter = () => {
        const selected = refs.courseFilter.value;
        const courses = [...new Set(assignments.map(({ course }) => course))].sort((a, b) => a.localeCompare(b));
        refs.courseFilter.replaceChildren(new Option('All courses', ''));
        courses.forEach((course) => refs.courseFilter.add(new Option(course, course)));
        refs.courseFilter.value = courses.includes(selected) ? selected : '';
    };

    const renderMonthWorkload = () => {
        const monthPrefix = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}`;
        const inMonth = assignments.filter((assignment) => assignment.dueDate.startsWith(monthPrefix));
        const estimatedMinutes = inMonth.reduce((total, assignment) => total + (assignment.estimatedMinutes || 0), 0);
        refs.monthWorkload.textContent = estimatedMinutes ? formatHours(estimatedMinutes).replace(' remaining', ' planned') : 'No time planned';
        refs.monthTaskCount.textContent = `${inMonth.length} ${inMonth.length === 1 ? 'assignment' : 'assignments'}`;
    };

    const renderCalendar = (visible) => {
        refs.calendarMonth.textContent = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(calendarMonth);
        const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
        const start = new Date(firstDay);
        start.setDate(firstDay.getDate() - firstDay.getDay());
        const byDate = visible.reduce((grouped, assignment) => {
            (grouped[assignment.dueDate] ||= []).push(assignment);
            return grouped;
        }, {});
        const cells = [];

        for (let offset = 0; offset < 42; offset += 1) {
            const date = new Date(start);
            date.setDate(start.getDate() + offset);
            const key = localDateString(date);
            const cell = document.createElement('div');
            cell.className = [
                'calendar-day',
                date.getMonth() !== calendarMonth.getMonth() ? 'is-outside-month' : '',
                key === selectedDate ? 'is-selected' : '',
                key === localDateString() ? 'is-today' : '',
            ].filter(Boolean).join(' ');
            cell.dataset.date = key;
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-label', formatDate(key, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
            cell.tabIndex = 0;

            const day = document.createElement('span');
            day.className = 'calendar-date';
            day.textContent = date.getDate();
            cell.appendChild(day);

            const eventList = document.createElement('div');
            eventList.className = 'calendar-events';
            const dayAssignments = byDate[key] || [];
            dayAssignments.slice(0, 3).forEach((assignment) => {
                const event = document.createElement('button');
                event.type = 'button';
                event.className = `calendar-assignment priority-${assignment.priority}${assignment.completed ? ' is-complete' : ''}${isOverdue(assignment) ? ' is-overdue' : ''}`;
                event.dataset.editId = assignment.id;
                event.textContent = assignment.title;
                eventList.appendChild(event);
            });
            if (dayAssignments.length > 3) {
                const more = document.createElement('span');
                more.className = 'calendar-more';
                more.textContent = `+${dayAssignments.length - 3} more`;
                eventList.appendChild(more);
            }
            cell.appendChild(eventList);
            cells.push(cell);
        }

        refs.calendarGrid.replaceChildren(...cells);
    };

    const renderSelectedDate = (visible) => {
        const selectedAssignments = visible.filter((assignment) => assignment.dueDate === selectedDate);
        const estimatedMinutes = selectedAssignments.reduce((total, assignment) => total + (assignment.estimatedMinutes || 0), 0);
        refs.selectedDateHeading.textContent = formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' });
        refs.selectedDateCount.textContent = `${selectedAssignments.length} ${selectedAssignments.length === 1 ? 'assignment' : 'assignments'}`;
        refs.selectedDateEstimate.textContent = formatHours(estimatedMinutes);
        refs.selectedDateEmpty.hidden = selectedAssignments.length > 0;

        const items = selectedAssignments.map((assignment) => {
            const item = document.createElement('li');
            item.className = `agenda-assignment${assignment.completed ? ' is-complete' : ''}`;
            item.appendChild(assignmentButton(assignment));
            const actions = document.createElement('div');
            actions.className = 'agenda-task-actions';
            actions.appendChild(actionButton(assignment));
            item.appendChild(actions);
            return item;
        });
        refs.selectedDateList.replaceChildren(...items);
    };

    const renderAgenda = (visible) => {
        const completed = visible.filter((assignment) => assignment.completed).length;
        refs.progressText.textContent = `${completed} of ${visible.length} complete`;
        refs.agendaEmpty.hidden = visible.length > 0;
        refs.agendaEmpty.textContent = assignments.length ? 'No assignments match your filters.' : 'No assignments yet.';

        const items = visible.map((assignment) => {
            const item = document.createElement('li');
            item.className = `assignment-item${assignment.completed ? ' is-complete' : ''}`;
            const main = assignmentButton(assignment, 'assignment-main');
            const meta = main.querySelector('.assignment-meta');
            meta.textContent = `${assignment.course} · ${formatDate(assignment.dueDate)} · ${relativeDueDate(assignment.dueDate)}${assignment.estimatedMinutes ? ` · ${formatHours(assignment.estimatedMinutes)}` : ''}`;
            item.append(main, actionButton(assignment));
            return item;
        });
        refs.agendaList.replaceChildren(...items);
    };

    const renderTheme = () => {
        const preference = document.documentElement.dataset.theme || 'system';
        refs.themeButtons.forEach((button) => {
            const selected = button.dataset.themeValue === preference;
            button.classList.toggle('is-active', selected);
            button.setAttribute('aria-pressed', selected);
        });
    };

    const render = () => {
        renderCourseFilter();
        const visible = visibleAssignments();
        renderMonthWorkload();
        renderCalendar(visible);
        renderSelectedDate(visible);
        renderAgenda(visible);
        renderTheme();
    };

    const setScreen = (screen) => {
        activeScreen = screen;
        refs.calendarScreen.hidden = screen !== 'calendar';
        refs.agendaScreen.hidden = screen !== 'agenda';
        refs.screenButtons.forEach((button) => {
            const selected = button.dataset.screen === screen;
            button.classList.toggle('is-active', selected);
            button.setAttribute('aria-pressed', selected);
        });
    };

    const closeDialog = () => {
        refs.dialog.close();
        refs.formError.textContent = '';
    };

    const openDialog = (assignment = null) => {
        refs.form.reset();
        refs.formError.textContent = '';
        refs.assignmentId.value = assignment?.id || '';
        refs.title.value = assignment?.title || '';
        refs.course.value = assignment?.course || '';
        refs.dueDate.value = assignment?.dueDate || selectedDate;
        refs.priority.value = assignment?.priority || 'medium';
        refs.estimate.value = assignment?.estimatedMinutes ? assignment.estimatedMinutes / 60 : '';
        refs.completed.checked = assignment?.completed || false;
        refs.completedField.hidden = !assignment;
        refs.delete.hidden = !assignment;
        refs.dialogKicker.textContent = assignment ? 'Assignment details' : 'New assignment';
        refs.dialogTitle.textContent = assignment ? 'Edit assignment' : 'Add assignment';
        refs.dialog.showModal();
        refs.title.focus();
    };

    const selectDate = (date) => {
        selectedDate = date;
        render();
    };

    const updateAssignmentCompletion = async (id) => {
        const assignment = assignments.find((item) => String(item.id) === String(id));
        if (!assignment) return;
        refs.loadError.textContent = '';
        try {
            const updated = await request(`${ASSIGNMENTS_URL}/${assignment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !assignment.completed }),
            });
            assignments = assignments.map((item) => item.id === updated.id ? updated : item);
            render();
        } catch (error) {
            refs.loadError.textContent = error.message;
        }
    };

    const reload = async () => {
        refs.loadError.textContent = '';
        try {
            assignments = await request(ASSIGNMENTS_URL);
            render();
        } catch (error) {
            refs.loadError.textContent = error.message;
        }
    };

    refs.form.addEventListener('submit', async (event) => {
        event.preventDefault();
        refs.formError.textContent = '';
        const estimatedHours = refs.estimate.value.trim();
        const estimatedMinutes = estimatedHours === '' ? null : Math.round(Number(estimatedHours) * 60);
        const payload = {
            title: refs.title.value.trim(),
            course: refs.course.value.trim(),
            dueDate: refs.dueDate.value,
            priority: refs.priority.value,
            estimatedMinutes,
        };

        if (!payload.title || !payload.course || !payload.dueDate || (estimatedHours !== '' && (!Number.isFinite(estimatedMinutes) || estimatedMinutes < 0))) {
            refs.formError.textContent = 'Enter a title, course, due date, and a valid study estimate.';
            return;
        }

        const existingId = refs.assignmentId.value;
        if (existingId) payload.completed = refs.completed.checked;

        try {
            const assignment = await request(existingId ? `${ASSIGNMENTS_URL}/${existingId}` : ASSIGNMENTS_URL, {
                method: existingId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            assignments = existingId
                ? assignments.map((item) => item.id === assignment.id ? assignment : item)
                : [...assignments, assignment];
            selectedDate = assignment.dueDate;
            calendarMonth = new Date(dateFromString(assignment.dueDate).getFullYear(), dateFromString(assignment.dueDate).getMonth(), 1);
            closeDialog();
            render();
        } catch (error) {
            refs.formError.textContent = error.message;
        }
    });

    refs.delete.addEventListener('click', async () => {
        const id = refs.assignmentId.value;
        if (!id || !window.confirm('Delete this assignment?')) return;
        refs.formError.textContent = '';
        try {
            await request(`${ASSIGNMENTS_URL}/${id}`, { method: 'DELETE' });
            assignments = assignments.filter((assignment) => String(assignment.id) !== id);
            closeDialog();
            render();
        } catch (error) {
            refs.formError.textContent = error.message;
        }
    });

    const handleAssignmentClick = (event) => {
        const toggle = event.target.closest('[data-toggle-id]');
        if (toggle) {
            updateAssignmentCompletion(toggle.dataset.toggleId);
            return;
        }
        const edit = event.target.closest('[data-edit-id]');
        if (!edit) return;
        const assignment = assignments.find((item) => String(item.id) === edit.dataset.editId);
        if (assignment) openDialog(assignment);
    };

    refs.calendarGrid.addEventListener('click', (event) => {
        if (event.target.closest('[data-edit-id]')) {
            handleAssignmentClick(event);
            return;
        }
        const day = event.target.closest('.calendar-day');
        if (day) selectDate(day.dataset.date);
    });
    refs.calendarGrid.addEventListener('keydown', (event) => {
        if (!['Enter', ' '].includes(event.key) || event.target !== event.currentTarget && !event.target.classList.contains('calendar-day')) return;
        const day = event.target.closest('.calendar-day');
        if (!day) return;
        event.preventDefault();
        selectDate(day.dataset.date);
    });
    refs.selectedDateList.addEventListener('click', handleAssignmentClick);
    refs.agendaList.addEventListener('click', handleAssignmentClick);

    refs.search.addEventListener('input', render);
    refs.courseFilter.addEventListener('change', render);
    refs.previousMonth.addEventListener('click', () => {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
        render();
    });
    refs.nextMonth.addEventListener('click', () => {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
        render();
    });
    refs.today.addEventListener('click', () => {
        calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        selectDate(localDateString());
    });
    refs.quickAdd.addEventListener('click', () => openDialog());
    refs.selectedDayAdd.addEventListener('click', () => openDialog());
    refs.dialogClose.addEventListener('click', closeDialog);
    refs.dialogCancel.addEventListener('click', closeDialog);
    refs.screenButtons.forEach((button) => button.addEventListener('click', () => setScreen(button.dataset.screen)));
    refs.themeButtons.forEach((button) => button.addEventListener('click', async () => {
        const previousPreference = document.documentElement.dataset.theme || 'system';
        const preference = button.dataset.themeValue;
        document.documentElement.dataset.theme = preference;
        document.documentElement.dataset.resolvedTheme = preference === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : preference;
        renderTheme();
        try {
            await request(THEME_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: preference }),
            });
        } catch (error) {
            document.documentElement.dataset.theme = previousPreference;
            document.documentElement.dataset.resolvedTheme = previousPreference === 'system'
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : previousPreference;
            renderTheme();
            refs.loadError.textContent = error.message;
        }
    }));
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        if (document.documentElement.dataset.theme === 'system') {
            document.documentElement.dataset.resolvedTheme = event.matches ? 'dark' : 'light';
        }
    });

    setScreen(activeScreen);
    reload();
}

document.addEventListener('DOMContentLoaded', initAssignmentTracker);
