const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function commandExists(command, args = []) {
  const check = spawnSync(command, [...args, "--version"], {
    stdio: "ignore",
  });
  return check.status === 0;
}

function detectSystemPython() {
  const candidates = process.platform === "win32"
    ? [
        { command: "py", prefix: ["-3"] },
        { command: "python", prefix: [] },
        { command: "python3", prefix: [] },
      ]
    : [
        { command: "python3", prefix: [] },
        { command: "python", prefix: [] },
        { command: "py", prefix: ["-3"] },
      ];

  for (const candidate of candidates) {
    if (commandExists(candidate.command, candidate.prefix)) {
      return candidate;
    }
  }

  throw new Error("Python 3 was not found. Install Python 3.10+ and retry.");
}

function getVenvPython(venvPath) {
  const pythonPath = process.platform === "win32"
    ? path.join(venvPath, "Scripts", "python.exe")
    : path.join(venvPath, "bin", "python");

  return fs.existsSync(pythonPath) ? pythonPath : null;
}

function runOrFail(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    console.error(`Failed to run command: ${command} ${args.join(" ")}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`Command failed: ${command} ${args.join(" ")}`);
    process.exit(result.status || 1);
  }
}

module.exports = {
  detectSystemPython,
  getVenvPython,
  runOrFail,
};
