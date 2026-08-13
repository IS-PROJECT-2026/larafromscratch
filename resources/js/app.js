const STORAGE_KEY = 'assignment-tracker.items.v1';

function loadAssignments() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);

		if (!raw) {
			return [];
		}

		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		console.error('Failed to read assignments from localStorage.', error);
		return [];
	}
}

function saveAssignments(assignments) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}

function createAssignment({ title, course, dueDate }) {
	return {
		id: crypto.randomUUID(),
		title,
		course,
		dueDate,
		completed: false,
		createdAt: Date.now(),
	};
}

function sortAssignments(assignments) {
	return [...assignments].sort((a, b) => {
		const completeA = a.completed ? 1 : 0;
		const completeB = b.completed ? 1 : 0;

		if (completeA !== completeB) {
			return completeA - completeB;
		}

		if (a.dueDate !== b.dueDate) {
			return a.dueDate.localeCompare(b.dueDate);
		}

		return a.createdAt - b.createdAt;
	});
}

function formatDueDate(value) {
	const date = new Date(`${value}T00:00:00`);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(date);
}

function renderAssignments(assignments, refs) {
	refs.list.innerHTML = '';

	const sorted = sortAssignments(assignments);

	for (const assignment of sorted) {
		const item = document.createElement('li');
		item.className = `assignment-item${assignment.completed ? ' is-complete' : ''}`;

		const content = document.createElement('div');
		content.className = 'assignment-content';

		const title = document.createElement('p');
		title.className = 'assignment-title';
		title.textContent = assignment.title;

		const meta = document.createElement('p');
		meta.className = 'assignment-meta';
		meta.textContent = `${assignment.course} | Due ${formatDueDate(assignment.dueDate)}`;

		content.appendChild(title);
		content.appendChild(meta);

		const actions = document.createElement('div');
		actions.className = 'assignment-actions';

		const completeButton = document.createElement('button');
		completeButton.type = 'button';
		completeButton.className = 'assignment-action assignment-complete';
		completeButton.dataset.action = 'toggle';
		completeButton.dataset.id = assignment.id;
		completeButton.textContent = assignment.completed ? 'Undo' : 'Complete';

		const deleteButton = document.createElement('button');
		deleteButton.type = 'button';
		deleteButton.className = 'assignment-action assignment-delete';
		deleteButton.dataset.action = 'delete';
		deleteButton.dataset.id = assignment.id;
		deleteButton.textContent = 'Delete';

		actions.appendChild(completeButton);
		actions.appendChild(deleteButton);

		item.appendChild(content);
		item.appendChild(actions);
		refs.list.appendChild(item);
	}

	refs.empty.hidden = sorted.length > 0;
}

function initAssignmentTracker() {
	const root = document.getElementById('assignment-tracker');

	if (!root) {
		return;
	}

	const refs = {
		form: document.getElementById('assignment-form'),
		title: document.getElementById('assignment-title'),
		course: document.getElementById('assignment-course'),
		dueDate: document.getElementById('assignment-due-date'),
		error: document.getElementById('assignment-form-error'),
		list: document.getElementById('assignment-list'),
		empty: document.getElementById('assignment-empty-state'),
	};

	let assignments = loadAssignments();

	const sync = () => {
		saveAssignments(assignments);
		renderAssignments(assignments, refs);
	};

	refs.form.addEventListener('submit', (event) => {
		event.preventDefault();
		refs.error.textContent = '';

		const title = refs.title.value.trim();
		const course = refs.course.value.trim();
		const dueDate = refs.dueDate.value;

		if (!title || !course || !dueDate) {
			refs.error.textContent = 'Title, course, and due date are all required.';
			return;
		}

		assignments = [...assignments, createAssignment({ title, course, dueDate })];

		refs.form.reset();
		refs.title.focus();
		sync();
	});

	refs.list.addEventListener('click', (event) => {
		const target = event.target.closest('[data-action]');

		if (!target) {
			return;
		}

		const { action, id } = target.dataset;

		if (action === 'toggle') {
			assignments = assignments.map((assignment) =>
				assignment.id === id
					? { ...assignment, completed: !assignment.completed }
					: assignment,
			);
			sync();
			return;
		}

		if (action === 'delete') {
			assignments = assignments.filter((assignment) => assignment.id !== id);
			sync();
		}
	});

	sync();
}

document.addEventListener('DOMContentLoaded', initAssignmentTracker);
