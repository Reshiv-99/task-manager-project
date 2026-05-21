const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// GET /api/dashboard?project=<id>
router.get('/', protect, async (req, res) => {
  try {
    const { project: projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: 'project query param required' });

    const project = await Project.findById(projectId).populate('members.user', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Not a project member' });

    const tasks = await Task.find({ project: projectId }).populate('assignedTo', 'name email');

    const now = new Date();
    const totalTasks = tasks.length;
    const byStatus = {
      'To Do': tasks.filter(t => t.status === 'To Do').length,
      'In Progress': tasks.filter(t => t.status === 'In Progress').length,
      'Done': tasks.filter(t => t.status === 'Done').length
    };
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done').length;

    // Tasks per user
    const perUser = {};
    tasks.forEach(task => {
      if (task.assignedTo) {
        const uid = task.assignedTo._id.toString();
        if (!perUser[uid]) perUser[uid] = { name: task.assignedTo.name, email: task.assignedTo.email, count: 0 };
        perUser[uid].count++;
      }
    });

    res.json({
      totalTasks,
      byStatus,
      overdue,
      tasksPerUser: Object.values(perUser),
      recentTasks: tasks.slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
