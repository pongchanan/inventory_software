const path = require("path");
const { detectSystemPython, getVenvPython, runOrFail } = require("./python_exec.cjs");

const repoRoot = path.resolve(__dirname, "..", "..");
const backendDir = path.join(repoRoot, "backend");
const frontendDir = path.join(repoRoot, "frontend");
const venvDir = path.join(backendDir, "venv");

runOrFail("npm", ["install"], { cwd: repoRoot, shell: process.platform === "win32" });
runOrFail("npm", ["install"], { cwd: frontendDir, shell: process.platform === "win32" });

const python = detectSystemPython();
runOrFail(python.command, [...python.prefix, "-m", "venv", venvDir], { cwd: repoRoot });

const venvPython = getVenvPython(venvDir);
if (!venvPython) {
  throw new Error("Created backend/venv but python executable was not found inside it.");
}

runOrFail(venvPython, ["-m", "pip", "install", "--upgrade", "pip"], { cwd: backendDir });
runOrFail(venvPython, ["-m", "pip", "install", "-r", "requirements.txt"], { cwd: backendDir });
runOrFail(venvPython, ["-m", "pip", "install", "-r", "test/requirements-test.txt"], { cwd: backendDir });
