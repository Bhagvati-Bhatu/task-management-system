class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.apiUrl = 'http://localhost:3001/api'; // Backend API URL
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadTasks();
        this.render();
        this.updateProgress();
    }

    bindEvents() {
        // Add task form
        document.getElementById('taskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addTask();
        });

        // Filter buttons
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Edit modal save button
        document.getElementById('saveChanges').addEventListener('click', async () => {
            await this.saveEditedTask();
        });
    }

    // Load tasks from backend
    async loadTasks() {
        try {
            const response = await fetch(`${this.apiUrl}/tasks`);
            const result = await response.json();
            
            if (result.success) {
                this.tasks = result.data;
            } else {
                this.showError('Failed to load tasks');
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showError('Failed to connect to server');
        }
    }

    async addTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const category = document.getElementById('taskCategory').value;

        if (!title) return;

        try {
            const response = await fetch(`${this.apiUrl}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    description,
                    category
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadTasks(); // Reload tasks from server
                this.render();
                this.updateProgress();
                
                // Reset form
                document.getElementById('taskForm').reset();
                this.showSuccess('Task added successfully!');
            } else {
                this.showError(result.error || 'Failed to add task');
            }
        } catch (error) {
            console.error('Error adding task:', error);
            this.showError('Failed to add task');
        }
    }

    async deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        const taskElement = document.querySelector(`[data-task-id="${id}"]`);
        taskElement.classList.add('slide-out');
        
        try {
            const response = await fetch(`${this.apiUrl}/tasks/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.success) {
                setTimeout(async () => {
                    await this.loadTasks();
                    this.render();
                    this.updateProgress();
                }, 300);
                this.showSuccess('Task deleted successfully!');
            } else {
                taskElement.classList.remove('slide-out');
                this.showError(result.error || 'Failed to delete task');
            }
        } catch (error) {
            taskElement.classList.remove('slide-out');
            console.error('Error deleting task:', error);
            this.showError('Failed to delete task');
        }
    }

    async toggleTask(id) {
        const task = this.tasks.find(task => task._id === id);
        if (!task) return;

        try {
            const response = await fetch(`${this.apiUrl}/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    completed: !task.completed
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadTasks();
                this.render();
                this.updateProgress();
            } else {
                this.showError(result.error || 'Failed to update task');
            }
        } catch (error) {
            console.error('Error toggling task:', error);
            this.showError('Failed to update task');
        }
    }

    async editTask(id) {
        const task = this.tasks.find(task => task._id === id);
        if (task) {
            this.editingTaskId = id;
            document.getElementById('editTitle').value = task.title;
            document.getElementById('editDescription').value = task.description || '';
            document.getElementById('editCategory').value = task.category;
            
            const modal = new bootstrap.Modal(document.getElementById('editModal'));
            modal.show();
        }
    }

    async saveEditedTask() {
        if (!this.editingTaskId) return;

        const title = document.getElementById('editTitle').value.trim();
        const description = document.getElementById('editDescription').value.trim();
        const category = document.getElementById('editCategory').value;

        if (!title) {
            this.showError('Task title is required');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/tasks/${this.editingTaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    description,
                    category
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadTasks();
                this.render();
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
                modal.hide();
                this.showSuccess('Task updated successfully!');
            } else {
                this.showError(result.error || 'Failed to update task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            this.showError('Failed to update task');
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
            <div class="card task-card ${task.category} ${task.completed ? 'completed' : ''} fade-in" data-task-id="${task._id}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-1">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" ${task.completed ? 'checked' : ''} 
                                       onchange="taskManager.toggleTask('${task._id}')">
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
                            <button class="btn btn-sm btn-outline-primary btn-action" onclick="taskManager.editTask('${task._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-action" onclick="taskManager.deleteTask('${task._id}')">
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

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} toast-message`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1050;
            min-width: 250px;
            padding: 12px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize the task manager
const taskManager = new TaskManager();

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
