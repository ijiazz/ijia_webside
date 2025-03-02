import { DbPool, createPgPool } from "@ijia/data/yoursql";
import { initIjiaDb } from "@ijia/data/testlib";
import { spawn, ChildProcess } from "node:child_process";

export async function runContainer() {
  const ps = spawn("docker", ["compose", "up"], { cwd: "..", stdio: [null, "pipe", "inherit"] });

  const pool = await createPgPool({ database: "ijia" });
  await initIjiaDb(pool);
  //TODO
  return new ServerHandle(ps, new URL("pg://localhost:5173/ijia"), "");
}

function dockerRun() {
  const ps = spawn("docker", ["run", "--rm", "up"], { cwd: "..", stdio: [null, "pipe", "inherit"] });
}
class ServerHandle {
  constructor(
    private ps: ChildProcess,
    readonly dbUrl: URL,
    readonly webUrl: string,
  ) {}
  close() {
    if (this.ps.killed) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      this.ps.kill("SIGINT");
      let k = setTimeout(() => {
        this.ps.kill("SIGKILL");
      }, 5000);
      this.ps.once("exit", () => {
        clearTimeout(k);
        resolve();
      });
    });
  }
  connectDb(): DbPool {
    return createPgPool(this.dbUrl);
  }
}
