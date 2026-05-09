@echo off
title ChatFlow
echo Instalando dependencias...
call npm install
echo.
echo Iniciando ChatFlow en http://localhost:3001
call npm run dev -- -p 3001
pause
