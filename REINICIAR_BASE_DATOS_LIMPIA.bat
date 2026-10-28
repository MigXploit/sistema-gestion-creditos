@echo off
chcp 65001 > nul
title Restaurar Base de Datos Limpia - Sistema de Créditos UMSA
color 0E

echo ===============================================================================
echo        RESTAURAR BASE DE DATOS LIMPIA (creditos_db) - UMSA INF-241
echo ===============================================================================
echo.
echo Este script restablecerá la base de datos a su estado original con:
echo   - Todas las tablas normalizadas (3FN) creadas.
echo   - Los 6 usuarios de los integrantes del grupo cargados.
echo   - El cliente en mora "Gonzalo Quispe Ticona" (CRE-2026-MORA) listo para demostración.
echo   - Solicitudes y garantías de prueba iniciales.
echo.
set /p CONFIRMAR="¿Desea restaurar la base de datos ahora? (S/N): "
if /i not "%CONFIRMAR%"=="S" (
    echo Operación cancelada por el usuario.
    pause
    exit /b
)

set MYSQL_CMD=mysql
if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_CMD=C:\xampp\mysql\bin\mysql.exe
)

echo.
echo [1/2] Aplicando esquema de base de datos (01_schema_mysql.sql)...
"%MYSQL_CMD%" -u root -e "DROP DATABASE IF EXISTS creditos_db; CREATE DATABASE creditos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
"%MYSQL_CMD%" -u root creditos_db < "%~dp0database\mysql\01_schema_mysql.sql"

if %ERRORLEVEL% neq 0 (
    echo ❌ Error al aplicar el esquema. Verifique que MySQL esté iniciado en XAMPP.
    pause
    exit /b
)

echo [2/2] Insertando datos semilla y clientes de prueba (02_seed_mysql.sql)...
"%MYSQL_CMD%" -u root creditos_db < "%~dp0database\mysql\02_seed_mysql.sql"

if %ERRORLEVEL% neq 0 (
    echo ❌ Error al insertar datos semilla.
    pause
    exit /b
)

echo.
echo ===============================================================================
echo  ✅ BASE DE DATOS RESTAURADA EXITOSAMENTE AL ESTADO ORIGINAL LIMPIO.
echo ===============================================================================
echo.
pause
