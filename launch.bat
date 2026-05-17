@echo off
title Captain Cool - SRE Stack
echo.
echo  ============================================
echo   CAPTAIN COOL - Multi-Agent IPL Strategist
echo   Built on Google Gemini 2.5 Flash
echo  ============================================
echo.

echo [1/3] Igniting AI Orchestration Engine (port 3001)...
cd "c:\Users\Vshal\Desktop\gdg cloud pune\captain-cool-agent"
start "AI Engine :3001" cmd /c "node server.js"

echo [2/3] Booting Next.js SRE Dashboard (port 3000)...
cd "c:\Users\Vshal\Desktop\gdg cloud pune\captain-cool-ui"
start "SRE Dashboard :3000" cmd /c "npm run dev"

echo [3/3] Waiting for services to be ready...
timeout /t 5 /nobreak > NUL

echo.
echo  Checking backend health...
:HEALTH_CHECK
curl -s http://localhost:3001/health > NUL 2>&1
if %errorlevel% neq 0 (
  timeout /t 2 /nobreak > NUL
  goto HEALTH_CHECK
)

echo  Backend ONLINE at http://localhost:3001
echo  Dashboard ONLINE at http://localhost:3000
echo.
echo  All systems go. Opening Dashboard...
start http://localhost:3000
