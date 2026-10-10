@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-vital.ps1" -EnablePhoneCamera -OpenBrowser
if errorlevel 1 pause
