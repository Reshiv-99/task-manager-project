# Team Task Manager

A full-stack Team Task Management application built with React, Node.js/Express, and MongoDB.

## Tech Stack
- **Frontend**: React 18 + Vite + React Router
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (JSON Web Tokens)

## Quick Start (Windows)

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally on port 27017

### 1. Double-click `start.bat`
That's it! It installs all dependencies and opens two terminal windows.

### 2. Open your browser
Go to **http://localhost:3000**

---

## Manual Setup

### Backend
```bash
cd backend
npm install
npm run dev        # starts on http://localhost:5000
```

### Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:3000
```

## Environment Variables
Backend `.env` is pre-configured for local MongoDB. Edit if needed:
```
MONGO_URI=mongodb://localhost:27017/teamtaskmanager
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5000
```

## Features
- **Auth**: Signup / Login with JWT
- **Projects**: Create projects, manage members, role-based access (Admin/Member)
- **Tasks**: Create, assign, update status (To Do / In Progress / Done), priority, due dates
- **Dashboard**: Stats - total tasks, by status, overdue, tasks per user
- **Role-Based**: Admins manage everything; Members only update their assigned tasks

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/projects | My projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Project detail |
| PUT | /api/projects/:id | Update project (Admin) |
| DELETE | /api/projects/:id | Delete project (Admin) |
| POST | /api/projects/:id/members | Add member (Admin) |
| DELETE | /api/projects/:id/members/:uid | Remove member (Admin) |
| GET | /api/tasks?project=id | Get tasks |
| POST | /api/tasks | Create task (Admin) |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task (Admin) |
| GET | /api/dashboard?project=id | Dashboard stats |

## Deployment (Railway)

1. Push to GitHub
2. On Railway: New Project → Deploy from GitHub
3. Add environment variables (MONGO_URI, JWT_SECRET, PORT)
4. Add MongoDB plugin or use MongoDB Atlas
5. Set build command: `cd frontend && npm run build`
6. Set start command: `cd backend && npm start`
