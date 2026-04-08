@echo off
REM Run all Robot Framework system tests against the local backend.
REM Usage: run_tests.bat [optional robot args]
REM
REM Override the base URL or credentials if needed:
REM   run_tests.bat -v BASE_URL:http://localhost:3000
REM   run_tests.bat -v ADMIN_EMAIL:other@mail.com -v ADMIN_PASSWORD:secret

set SCRIPT_DIR=%~dp0

pip install -q -r "%SCRIPT_DIR%requirements-robot.txt"

robot ^
    --outputdir "%SCRIPT_DIR%results" ^
    --variable BASE_URL:http://localhost:3000 ^
    --variable ADMIN_EMAIL:testadmin@gmail.com ^
    --variable ADMIN_PASSWORD:admin123 ^
    %* ^
    "%SCRIPT_DIR%suites"
