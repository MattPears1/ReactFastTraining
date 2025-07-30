@echo off
echo Finding your WiFi IP address...
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4" ^| findstr /c:"192.168"') do (
    set IP=%%a
    set IP=!IP: =!
    echo Your WiFi IP is: %%a
)

echo.
echo Try these URLs on your phone:
echo.
echo   http://192.168.0.230:3000/
echo   http://192.168.0.230:5173/
echo.
echo Make sure:
echo   1. Your phone is on the same WiFi network
echo   2. You're using WiFi (not mobile data)
echo   3. Accept any security warnings in your browser
echo.
pause