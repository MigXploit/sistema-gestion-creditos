@echo off
chcp 65001 > nul
title Sistema de Créditos Bancarios - UMSA INF-241 (Modo Local Offline)
color 0B

echo ===============================================================================
echo       UNIVERSIDAD MAYOR DE SAN ANDRÉS · CARRERA DE INFORMÁTICA
echo        INF-241: ANÁLISIS Y DISEÑO DE SISTEMAS I · SISTEMA DE CRÉDITOS
echo                     MODO LOCAL COMPLETAMENTE OFFLINE
echo ===============================================================================
echo.
echo Integrantes del Grupo:
echo   - Miguel Angel Bustillos Choque   - Jefe de Créditos      (login: mbustillos)
echo   - Saúl Walter Callisaya Sumi     - Oficial de Crédito    (login: scallisaya)
echo   - Ranulfo Antonio Rojas Guachalla - Analista de Riesgos   (login: rrojas)
echo   - Royer Marcos Patty Mamani       - Cajero de Ventanilla  (login: rpatty)
echo   - Alex Arturo Jamachi Condori     - Gerente General       (login: ajamachi)
echo   - Ramiro Flores                   - Administrador         (login: admin)
echo   (Contraseña universal para todos: Bancario2026!)
echo.
echo ===============================================================================
echo.

:: 1. Verificar si el puerto 3306 de MySQL está activo
netstat -ano | findstr :3306 | findstr LISTENING > nul
if %ERRORLEVEL% equ 0 (
    echo [1/3] Base de Datos MySQL: ACTIVA en localhost:3306.
) else (
    echo [1/3] Base de Datos MySQL no detectada en puerto 3306.
    echo       Iniciando servicio MySQL de XAMPP automáticamente...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start /b "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 3 /nobreak > nul
        echo       MySQL iniciado en segundo plano.
    ) else (
        echo [AVISO] Inicie el módulo MySQL desde el panel de control de XAMPP.
    )
)

echo.
echo [2/3] Iniciando Servidor Bancario Integrado (Backend REST + Frontend Web SPA)...
echo       URL Local de Acceso: http://localhost:8080
echo.

:: 2. Iniciar navegador web automáticamente
timeout /t 2 /nobreak > nul
start "" "http://localhost:8080"

:: 3. Iniciar el servidor backend que sirve la API y el Frontend Web compilado
cd /d "%~dp0backend"
node src/servidor.js

pause
