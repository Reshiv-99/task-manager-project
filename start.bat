@echo off
echo ========================================
echo    Team Task Manager - Setup & Start
echo ========================================
echo.

echo [1/3] Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo [2/3] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [3/3] Starting servers...
echo  - Backend: http://localhost:5000
echo  - Frontend: http://localhost:3000
echo.
echo Make sure MongoDB is running on localhost:27017
echo.

start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak > nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo Both servers are starting in separate windows!
echo Open http://localhost:3000 in your browser.
pause
