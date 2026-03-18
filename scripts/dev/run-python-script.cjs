const path = require("path");
const { detectSystemPython, getVenvPython, runOrFail } = require("./python_exec.cjs");

const repoRoot = path.resolve(__dirname, "..", "..");
const args = process.argv.slice(2);

let cwdRelative = ".";
let venvRelative = null;
let index = 0;

while (index < args.length) {
  const arg = args[index];
  if (arg === "--cwd") {
    cwdRelative = args[index + 1];
    index += 2;
    continue;
  }
  if (arg === "--venv") {
    venvRelative = args[index + 1];
    index += 2;
    continue;
  }
  break;
}

const target = args[index];
if (!target) {
  throw new Error("Missing python target script. Usage: node scripts/dev/run-python-script.cjs [--cwd dir] [--venv path] <script> [args...]");
}

const scriptArgs = args.slice(index + 1);
const cwd = path.resolve(repoRoot, cwdRelative);

let pythonCommand = null;
let pythonArgsPrefix = [];

if (venvRelative) {
  const venvPython = getVenvPython(path.resolve(repoRoot, venvRelative));
  if (venvPython) {
    pythonCommand = venvPython;
  }
}

if (!pythonCommand) {
  const python = detectSystemPython();
  pythonCommand = python.command;
  pythonArgsPrefix = python.prefix;
}

const targetPath = path.resolve(repoRoot, target);
runOrFail(pythonCommand, [...pythonArgsPrefix, targetPath, ...scriptArgs], { cwd });
