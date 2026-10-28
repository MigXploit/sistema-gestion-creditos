@echo off
chcp 65001 > nul
title Sistema de Créditos Bancarios - Modo Desarrollo (Hot Reload)
color 0D

echo ===============================================================================
echo       UNIVERSIDAD MAYOR DE SAN ANDRÉS · CARRERA DE INFORMÁTICA
echo        MODO DESARROLLO (Vite Hot-Reload en 5173 + Backend REST en 8080)
echo ===============================================================================
echo.

:: Iniciar Backend en una ventana nueva
start "Servidor Backend REST (Port 8080)" cmd /k "cd /d "%~dp0backend" && npm start"

:: Esperar 2 segundos
timeout /t 2 /nobreak > nul

:: Iniciar Frontend Vite en la ventana actual
cd /d "%~dp0frontend"
npm run dev
