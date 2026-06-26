import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const envFile = ".env.docker";
const shouldBuild = process.argv.includes("--build");

if (!existsSync(envFile)) {
  console.error(
    `Falta o ficheiro ${envFile}. Cria-o com: cp .env.example ${envFile}`,
  );
  process.exit(1);
}

function runDockerCompose(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["compose", ...args], {
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      resolve({
        code: code ?? 0,
        signal,
      });
    });
  });
}

let shuttingDown = false;
let upProcess;
let downPromise;

async function ensureDown() {
  if (!downPromise) {
    downPromise = runDockerCompose(["down"]);
  }

  return downPromise;
}

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (upProcess && upProcess.exitCode === null && upProcess.signalCode === null) {
    upProcess.kill(signal);
  }
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

try {
  const upArgs = ["up"];
  if (shouldBuild) {
    upArgs.push("--build");
  }

  upProcess = spawn("docker", ["compose", ...upArgs], {
    stdio: "inherit",
  });

  upProcess.on("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });

  upProcess.on("exit", async (code, signal) => {
    const downResult = await ensureDown();

    if (shuttingDown) {
      process.exit(downResult.code);
    }

    if (code !== 0) {
      process.exit(code ?? downResult.code);
    }

    if (signal) {
      process.exit(downResult.code);
    }

    process.exit(downResult.code);
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
