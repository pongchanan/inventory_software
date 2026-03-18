const path = require("path");
const { detectSystemPython, getVenvPython, runOrFail } = require("./python_exec.cjs");

const repoRoot = path.resolve(__dirname, "..", "..");
const backendDir = path.join(repoRoot, "backend");
const venvDir = path.join(backendDir, "venv");

const venvPython = getVenvPython(venvDir);

if (venvPython) {
  runOrFail(venvPython, ["-m", "app.main"], { cwd: backendDir });
} else {
  const python = detectSystemPython();
  runOrFail(python.command, [...python.prefix, "-m", "app.main"], { cwd: backendDir });
}
