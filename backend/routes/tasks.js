const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET /api/tasks - Get all tasks with filtering and sorting
router.get('/', async (req, res) => {
    try {
        const { completed, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        // Build filter object
        const filter = {};
        if (completed !== undefined) {
            filter.completed = completed === 'true';
        }
        if (category && category !== 'all') {
            filter.category = category;
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const tasks = await Task.find(filter).sort(sort);
        
        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/tasks - Create new task
router.post('/', async (req, res) => {
    try {
        const { title, description, category, priority, dueDate } = req.body;

        // Validation
        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Task title is required'
            });
        }

        const task = new Task({
            title: title.trim(),
            description: description ? description.trim() : '',
            category: category || 'personal',
            priority: priority || 'medium',
            dueDate: dueDate || null
        });

        const savedTask = await task.save();
        
        res.status(201).json({
            success: true,
            data: savedTask
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
    try {
        const { title, description, category, completed, priority, dueDate } = req.body;

        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Update fields if provided
        if (title !== undefined) task.title = title.trim();
        if (description !== undefined) task.description = description.trim();
        if (category !== undefined) task.category = category;
        if (completed !== undefined) task.completed = completed;
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate;

        const updatedTask = await task.save();
        
        res.json({
            success: true,
            data: updatedTask
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        await Task.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/tasks/stats/summary - Get task statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const total = await Task.countDocuments();
        const completed = await Task.countDocuments({ completed: true });
        const pending = total - completed;
        
        const byCategory = await Task.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                total,
                completed,
                pending,
                percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
                byCategory: byCategory.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
