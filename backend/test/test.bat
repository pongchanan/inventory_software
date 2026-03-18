@echo off
REM Test runner helper for Windows - Simplifies running different test suites
REM
REM Usage:
REM   test.bat auto      - Run automated tests
REM   test.bat unit      - Run unit tests only
REM   test.bat contract  - Run contract tests
REM   test.bat manual    - Run manual tests (requires backend running)
REM   test.bat all       - Run all tests
REM   test.bat coverage  - Run with coverage
REM   test.bat help      - Show this help

setlocal enabledelayedexpansion

if "%1"=="" goto :help
if "%1"=="help" goto :help
if "%1"=="-h" goto :help
if "%1"=="--help" goto :help

set COMMAND=%1

if "%COMMAND%"=="auto" (
    echo.
    echo ▶ Running automated tests (fast, deterministic - excludes manual)
    echo.
    call pytest --ignore=test/manual
    goto :end
)

if "%COMMAND%"=="unit" (
    echo.
    echo ▶ Running unit tests only (single component, no external deps)
    echo.
    call pytest -m unit --ignore=test/manual
    goto :end
)

if "%COMMAND%"=="contract" (
    echo.
    echo ▶ Running contract tests only (API validation)
    echo.
    call pytest -m contract --ignore=test/manual
    goto :end
)

if "%COMMAND%"=="integration" (
    echo.
    echo ▶ Running integration tests (cross-component)
    echo.
    call pytest -m integration --ignore=test/manual
    goto :end
)

if "%COMMAND%"=="manual" (
    echo.
    echo ▶ Running manual tests (requires backend at http://localhost:3000)
    echo.
    call pytest test/manual -m manual -v
    goto :end
)

if "%COMMAND%"=="fast" (
    echo.
    echo ▶ Fast TDD loop (unit+contract, stop on first failure)
    echo.
    call pytest -m "unit or contract" --ignore=test/manual -x
    goto :end
)

if "%COMMAND%"=="all" (
    echo.
    echo ▶ Running all tests including manual (requires backend + frontend)
    echo.
    call pytest -v
    goto :end
)

if "%COMMAND%"=="coverage" (
    echo.
    echo ▶ Running tests with coverage (automated only)
    echo.
    call pytest --cov=app --cov-report=html --cov-report=term-missing --ignore=test/manual
    goto :end
)

if "%COMMAND%"=="coverage-all" (
    echo.
    echo ▶ Running all tests with coverage (requires backend + frontend)
    echo.
    call pytest --cov=app --cov-report=html --cov-report=term-missing
    goto :end
)

echo ❌ Unknown command: %COMMAND%
goto :help

:help
cls
echo Test Runner Helper - Simplifies running different test suites
echo.
echo Usage:
echo   test.bat auto         - Run automated tests (default)
echo   test.bat unit         - Run unit tests only
echo   test.bat contract     - Run contract tests only
echo   test.bat integration  - Run integration tests only
echo   test.bat manual       - Run manual tests (requires backend)
echo   test.bat fast         - Fast TDD loop (stop on first failure)
echo   test.bat all          - Run all tests
echo   test.bat coverage     - Run with coverage report
echo   test.bat coverage-all - Run all with coverage
echo   test.bat help         - Show this help
echo.
echo Examples:
echo   test.bat              - Same as "test.bat auto"
echo   test.bat unit         - Only unit tests, fast feedback
echo   test.bat coverage     - Generate HTML coverage report
goto :end

:end
endlocal
