class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateProgress();
    }

    bindEvents() {
        // Add task form
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Filter buttons
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Edit modal save button
        document.getElementById('saveChanges').addEventListener('click', () => {
            this.saveEditedTask();
        });
    }

    addTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const category = document.getElementById('taskCategory').value;

        if (!title) return;

        const task = {
            id: Date.now(),
            title,
            description,
            category,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveToStorage();
        this.render();
        this.updateProgress();
        
        // Reset form
        document.getElementById('taskForm').reset();
    }

    deleteTask(id) {
        const taskElement = document.querySelector(`[data-task-id="${id}"]`);
        taskElement.classList.add('slide-out');
        
        setTimeout(() => {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveToStorage();
            this.render();
            this.updateProgress();
        }, 300);
    }

    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveToStorage();
            this.render();
            this.updateProgress();
        }
    }

    editTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            this.editingTaskId = id;
            document.getElementById('editTitle').value = task.title;
            document.getElementById('editDescription').value = task.description;
            document.getElementById('editCategory').value = task.category;
            
            const modal = new bootstrap.Modal(document.getElementById('editModal'));
            modal.show();
        }
    }

    saveEditedTask() {
        const task = this.tasks.find(task => task.id === this.editingTaskId);
        if (task) {
            task.title = document.getElementById('editTitle').value.trim();
            task.description = document.getElementById('editDescription').value.trim();
            task.category = document.getElementById('editCategory').value;
            
            this.saveToStorage();
            this.render();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
            modal.hide();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'pending':
                return this.tasks.filter(task => !task.completed);
            default:
                return this.tasks;
        }
    }

    render() {
        const container = document.getElementById('tasksContainer');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h4>No tasks found</h4>
                    <p>Add a new task to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTasks.map(task => `
            <div class="card task-card ${task.category} ${task.completed ? 'completed' : ''} fade-in" data-task-id="${task.id}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-1">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" ${task.completed ? 'checked' : ''} 
                                       onchange="taskManager.toggleTask(${task.id})">
                            </div>
                        </div>
                        <div class="col-md-8">
                            <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                            <div class="task-meta">
                                <span class="badge category-badge bg-secondary">${task.category}</span>
                                <small class="ms-2">${new Date(task.createdAt).toLocaleDateString()}</small>
                            </div>
                        </div>
                        <div class="col-md-3 task-actions">
                            <button class="btn btn-sm btn-outline-primary btn-action" onclick="taskManager.editTask(${task.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-action" onclick="taskManager.deleteTask(${task.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateProgress() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('progressBar').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = `${percentage}% Complete`;
        
        // Update progress bar color
        const progressBar = document.getElementById('progressBar');
        if (percentage === 100) {
            progressBar.className = 'progress-bar bg-success';
        } else if (percentage >= 50) {
            progressBar.className = 'progress-bar bg-warning';
        } else {
            progressBar.className = 'progress-bar bg-primary';
        }
    }

    saveToStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

// Initialize the task manager
const taskManager = new TaskManager();
