@echo off
title Subiendo Fluxo a GitHub...
echo ===================================================
echo   SUBIENDO FLUXO GASTRONOMIC SYSTEM A GITHUB
echo ===================================================
echo.
echo Conectando con https://github.com/ElEmiGomez/fluxo-gastro.git ...
"C:\Program Files\Git\cmd\git.exe" push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ===================================================
    echo   TODO SUBIDO A GITHUB CON EXITO!
    echo ===================================================
) else (
    echo Hubo un inconveniente. Revisa si iniciaste sesion en el navegador.
)
echo.
pause
