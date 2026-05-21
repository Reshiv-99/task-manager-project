import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const statusColor = { 'To Do': 'todo', 'In Progress': 'inprogress', 'Done': 'done' };
const priorityColor = { Low: 'low', Medium: 'medium', High: 'high' };

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 32, fontFamily: 'Syne', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [tab, setTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('Member');

  // Task modal
  const [taskModal, setTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '', priority: 'Medium', status: 'To Do', assignedTo: '' });
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState('');

  // Member modal
  const [memberModal, setMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('Member');
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberError, setMemberError] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [projRes, tasksRes, dashRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
        api.get(`/dashboard?project=${id}`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setDashboard(dashRes.data);
      const me = projRes.data.members.find(m => m.user._id === user?._id);
      setMyRole(me?.role || 'Member');
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) navigate('/');
    }
    setLoading(false);
  }, [id, user, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openNewTask = () => {
    setEditTask(null);
    setTaskForm({ title: '', description: '', dueDate: '', priority: 'Medium', status: 'To Do', assignedTo: '' });
    setTaskError('');
    setTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title, description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
      priority: task.priority, status: task.status,
      assignedTo: task.assignedTo?._id || ''
    });
    setTaskError('');
    setTaskModal(true);
  };

  const saveTask = async (e) => {
    e.preventDefault(); setTaskSaving(true); setTaskError('');
    try {
      const payload = { ...taskForm, project: id };
      if (!payload.dueDate) delete payload.dueDate;
      if (!payload.assignedTo) payload.assignedTo = null;
      if (editTask) await api.put(`/tasks/${editTask._id}`, payload);
      else await api.post('/tasks', payload);
      setTaskModal(false);
      loadAll();
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to save task');
    } finally { setTaskSaving(false); }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}`); loadAll(); } catch {}
  };

  const updateStatus = async (task, status) => {
    try { await api.put(`/tasks/${task._id}`, { status }); loadAll(); } catch {}
  };

  const addMember = async (e) => {
    e.preventDefault(); setMemberSaving(true); setMemberError('');
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setMemberModal(false); setMemberEmail(''); setMemberRole('Member');
      loadAll();
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    } finally { setMemberSaving(false); }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${id}/members/${userId}`); loadAll(); } catch {}
  };

  const deleteProject = async () => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try { await api.delete(`/projects/${id}`); navigate('/'); } catch {}
  };

  if (loading) return <div style={{ color: 'var(--text2)' }}>Loading...</div>;
  if (!project) return null;

  const isAdmin = myRole === 'Admin';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link to="/" style={{ color: 'var(--text2)', fontSize: 13, textDecoration: 'none' }}>← Projects</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 }}>
          <div>
            <h1 style={{ fontSize: 28 }}>{project.name}</h1>
            {project.description && <p style={{ color: 'var(--text2)', marginTop: 4 }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className={`badge badge-${myRole.toLowerCase()}`}>{myRole}</span>
            {isAdmin && <button className="btn btn-danger btn-sm" onClick={deleteProject}>Delete Project</button>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {['tasks', 'dashboard', 'members'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px',
            color: tab === t ? 'var(--accent)' : 'var(--text2)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            fontFamily: 'DM Sans', fontSize: 14, fontWeight: 500, textTransform: 'capitalize',
            marginBottom: -1
          }}>{t}</button>
        ))}
      </div>

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
            {isAdmin && <button className="btn btn-primary" onClick={openNewTask}>+ Add Task</button>}
          </div>

          {tasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
              {isAdmin ? 'No tasks yet. Add the first one!' : 'No tasks assigned to you yet.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map(task => (
                <div key={task._id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600 }}>{task.title}</span>
                      <span className={`badge badge-${priorityColor[task.priority]}`}>{task.priority}</span>
                    </div>
                    {task.description && <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>{task.description}</p>}
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text2)', flexWrap: 'wrap' }}>
                      {task.assignedTo && <span>👤 {task.assignedTo.name}</span>}
                      {task.dueDate && <span style={{ color: new Date(task.dueDate) < new Date() && task.status !== 'Done' ? 'var(--danger)' : 'var(--text2)' }}>
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                        {new Date(task.dueDate) < new Date() && task.status !== 'Done' ? ' ⚠️ Overdue' : ''}
                      </span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select value={task.status} onChange={e => updateStatus(task, e.target.value)}
                      style={{ width: 'auto', fontSize: 12, padding: '5px 10px' }}>
                      <option>To Do</option>
                      <option>In Progress</option>
                      <option>Done</option>
                    </select>
                    {isAdmin && (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditTask(task)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteTask(task._id)}>Del</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dashboard Tab */}
      {tab === 'dashboard' && dashboard && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard label="Total Tasks" value={dashboard.totalTasks} color="var(--accent)" />
            <StatCard label="To Do" value={dashboard.byStatus['To Do']} color="var(--text2)" />
            <StatCard label="In Progress" value={dashboard.byStatus['In Progress']} color="#9d96ff" />
            <StatCard label="Done" value={dashboard.byStatus['Done']} color="var(--accent3)" />
            <StatCard label="Overdue" value={dashboard.overdue} color="var(--danger)" />
          </div>

          {dashboard.tasksPerUser.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 16 }}>Tasks per Member</h3>
              {dashboard.tasksPerUser.map(u => (
                <div key={u.email} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{u.name}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{u.count} task{u.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {tab === 'members' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</p>
            {isAdmin && <button className="btn btn-primary" onClick={() => setMemberModal(true)}>+ Add Member</button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {project.members.map(m => (
              <div key={m.user._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{m.user.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>{m.user.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
                  {isAdmin && m.user._id !== project.createdBy._id && (
                    <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.user._id)}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {taskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2>{editTask ? 'Edit Task' : 'New Task'}</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20 }} onClick={() => setTaskModal(false)}>×</button>
            </div>
            {taskError && <div className="error" style={{ marginBottom: 12 }}>{taskError}</div>}
            <form onSubmit={saveTask}>
              <div className="form-group">
                <label>Title *</label>
                <input placeholder="Task title" value={taskForm.title}
                  onChange={e => setTaskForm({...taskForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} placeholder="Details..." value={taskForm.description}
                  onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={taskForm.dueDate}
                    onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                    <option>To Do</option><option>In Progress</option><option>Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Assign To</label>
                  <select value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                    <option value="">Unassigned</option>
                    {project.members.map(m => (
                      <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={taskSaving}>{taskSaving ? 'Saving...' : 'Save Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {memberModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2>Add Member</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20 }} onClick={() => setMemberModal(false)}>×</button>
            </div>
            {memberError && <div className="error" style={{ marginBottom: 12 }}>{memberError}</div>}
            <form onSubmit={addMember}>
              <div className="form-group">
                <label>User Email</label>
                <input type="email" placeholder="member@example.com" value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                  <option>Member</option><option>Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={memberSaving}>{memberSaving ? 'Adding...' : 'Add Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
