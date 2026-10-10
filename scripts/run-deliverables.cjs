const { existsSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const bundledPython = join(
  process.env.USERPROFILE || "",
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "python",
  "python.exe"
);

const python = existsSync(bundledPython) ? bundledPython : "python";
const result = spawnSync(python, ["scripts/generate_deliverables.py"], {
  cwd: join(__dirname, ".."),
  stdio: "inherit",
  shell: false
});

process.exit(result.status ?? 1);

