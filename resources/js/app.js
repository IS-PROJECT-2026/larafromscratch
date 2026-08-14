import Alpine from 'alpinejs';

window.Alpine = Alpine;
Alpine.start();

const ASSIGNMENTS_URL = '/assignments';
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

function localDateString(date = new Date()) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function formatDueDate(value) {
	const date = new Date(`${value}T00:00:00`);

	return Number.isNaN(date.getTime())
		? value
		: new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function sortAssignments(assignments) {
	return [...assignments].sort((a, b) =>
		a.dueDate.localeCompare(b.dueDate) || new Date(a.createdAt) - new Date(b.createdAt),
	);
}

function isOverdue(assignment) {
	return !assignment.completed && assignment.dueDate < localDateString();
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
			// A failed response does not always have JSON content.
		}
		throw new Error(message);
	}

	return response.status === 204 ? null : response.json();
}

function createAssignmentItem(assignment) {
	const item = document.createElement('li');
	item.className = `assignment-item${assignment.completed ? ' is-complete' : ''}${isOverdue(assignment) ? ' is-overdue' : ''}`;

	const content = document.createElement('div');
	content.className = 'assignment-content';
	const heading = document.createElement('div');
	heading.className = 'assignment-heading';
	const title = document.createElement('p');
	title.className = 'assignment-title';
	title.textContent = assignment.title;
	const priority = document.createElement('span');
	priority.className = `assignment-priority priority-${assignment.priority}`;
	priority.textContent = PRIORITY_LABELS[assignment.priority];
	heading.append(title, priority);

	const meta = document.createElement('p');
	meta.className = 'assignment-meta';
	meta.textContent = `${assignment.course} · Due ${formatDueDate(assignment.dueDate)}`;
	content.append(heading, meta);
	if (isOverdue(assignment)) {
		const overdue = document.createElement('p');
		overdue.className = 'assignment-overdue';
		overdue.textContent = 'Overdue';
		content.appendChild(overdue);
	}

	const actions = document.createElement('div');
	actions.className = 'assignment-actions';
	for (const [action, label, className] of [
		['toggle', assignment.completed ? 'Undo' : 'Complete', 'assignment-complete'],
		['delete', 'Delete', 'assignment-delete'],
	]) {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = `assignment-action ${className}`;
		button.dataset.action = action;
		button.dataset.id = assignment.id;
		button.textContent = label;
		actions.appendChild(button);
	}

	item.append(content, actions);
	return item;
}

function initAssignmentTracker() {
	const root = document.getElementById('assignment-tracker');
	if (!root) return;

	const refs = {
		form: document.getElementById('assignment-form'),
		title: document.getElementById('assignment-title'),
		course: document.getElementById('assignment-course'),
		dueDate: document.getElementById('assignment-due-date'),
		priority: document.getElementById('assignment-priority'),
		formError: document.getElementById('assignment-form-error'),
		loadError: document.getElementById('assignment-load-error'),
		search: document.getElementById('assignment-search'),
		courseFilter: document.getElementById('assignment-course-filter'),
		progressText: document.getElementById('assignment-progress-text'),
		progressBar: document.getElementById('assignment-progress-bar'),
		progressTrack: document.querySelector('.tracker-progress-track'),
		list: document.getElementById('assignment-list'),
		empty: document.getElementById('assignment-empty-state'),
		listView: document.getElementById('assignment-list-view'),
		calendarView: document.getElementById('assignment-calendar-view'),
		viewButtons: document.querySelectorAll('[data-view]'),
		monthLabel: document.getElementById('calendar-month'),
		calendarGrid: document.getElementById('assignment-calendar-grid'),
		previousMonth: document.getElementById('calendar-previous'),
		nextMonth: document.getElementById('calendar-next'),
	};

	let assignments = [];
	let activeView = 'list';
	let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

	const visibleAssignments = () => {
		const term = refs.search.value.trim().toLocaleLowerCase();
		const course = refs.courseFilter.value;
		return sortAssignments(assignments.filter((assignment) => {
			const matchesCourse = !course || assignment.course === course;
			const haystack = `${assignment.title} ${assignment.course}`.toLocaleLowerCase();
			return matchesCourse && (!term || haystack.includes(term));
		}));
	};

	const renderCourseFilter = () => {
		const selection = refs.courseFilter.value;
		const courses = [...new Set(assignments.map(({ course }) => course))].sort((a, b) => a.localeCompare(b));
		refs.courseFilter.replaceChildren(new Option('All courses', ''));
		for (const course of courses) refs.courseFilter.add(new Option(course, course));
		refs.courseFilter.value = courses.includes(selection) ? selection : '';
	};

	const renderProgress = (visible) => {
		const completed = visible.filter(({ completed: isComplete }) => isComplete).length;
		const percent = visible.length ? Math.round((completed / visible.length) * 100) : 0;
		refs.progressText.textContent = `${completed} of ${visible.length} (${percent}%)`;
		refs.progressBar.style.width = `${percent}%`;
		refs.progressTrack.setAttribute('aria-valuenow', percent);
	};

	const renderList = (visible) => {
		refs.list.replaceChildren(...visible.map(createAssignmentItem));
		refs.empty.hidden = visible.length > 0;
		refs.empty.textContent = assignments.length
			? 'No assignments match these filters.'
			: 'No assignments yet. Add your first one above.';
	};

	const renderCalendar = (visible) => {
		const monthName = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(calendarMonth);
		refs.monthLabel.textContent = monthName;
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
			cell.className = `calendar-day${date.getMonth() !== calendarMonth.getMonth() ? ' is-outside-month' : ''}`;
			cell.setAttribute('role', 'gridcell');
			cell.setAttribute('aria-label', formatDueDate(key));
			const day = document.createElement('span');
			day.className = 'calendar-date';
			day.textContent = date.getDate();
			cell.appendChild(day);
			for (const assignment of byDate[key] || []) {
				const entry = document.createElement('p');
				entry.className = `calendar-assignment priority-${assignment.priority}${assignment.completed ? ' is-complete' : ''}${isOverdue(assignment) ? ' is-overdue' : ''}`;
				entry.textContent = assignment.title;
				cell.appendChild(entry);
			}
			cells.push(cell);
		}
		refs.calendarGrid.replaceChildren(...cells);
	};

	const render = () => {
		renderCourseFilter();
		const visible = visibleAssignments();
		renderProgress(visible);
		renderList(visible);
		renderCalendar(visible);
	};

	const setView = (view) => {
		activeView = view;
		refs.listView.hidden = view !== 'list';
		refs.calendarView.hidden = view !== 'calendar';
		refs.viewButtons.forEach((button) => {
			const selected = button.dataset.view === view;
			button.classList.toggle('is-active', selected);
			button.setAttribute('aria-pressed', selected);
		});
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
		const payload = {
			title: refs.title.value.trim(),
			course: refs.course.value.trim(),
			dueDate: refs.dueDate.value,
			priority: refs.priority.value,
		};
		if (!payload.title || !payload.course || !payload.dueDate) {
			refs.formError.textContent = 'Title, course, and due date are all required.';
			return;
		}
		try {
			const assignment = await request(ASSIGNMENTS_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			assignments.push(assignment);
			refs.form.reset();
			refs.priority.value = 'medium';
			refs.title.focus();
			render();
		} catch (error) {
			refs.formError.textContent = error.message;
		}
	});

	refs.list.addEventListener('click', async (event) => {
		const button = event.target.closest('[data-action]');
		if (!button) return;
		const assignment = assignments.find(({ id }) => String(id) === button.dataset.id);
		if (!assignment) return;
		refs.loadError.textContent = '';
		button.disabled = true;
		try {
			if (button.dataset.action === 'toggle') {
				const updated = await request(`${ASSIGNMENTS_URL}/${assignment.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ completed: !assignment.completed }),
				});
				assignments = assignments.map((item) => item.id === updated.id ? updated : item);
			} else {
				await request(`${ASSIGNMENTS_URL}/${assignment.id}`, { method: 'DELETE' });
				assignments = assignments.filter((item) => item.id !== assignment.id);
			}
			render();
		} catch (error) {
			refs.loadError.textContent = error.message;
			button.disabled = false;
		}
	});

	refs.search.addEventListener('input', render);
	refs.courseFilter.addEventListener('change', render);
	refs.viewButtons.forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
	refs.previousMonth.addEventListener('click', () => {
		calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
		renderCalendar(visibleAssignments());
	});
	refs.nextMonth.addEventListener('click', () => {
		calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
		renderCalendar(visibleAssignments());
	});

	setView(activeView);
	reload();
}

document.addEventListener('DOMContentLoaded', initAssignmentTracker);
