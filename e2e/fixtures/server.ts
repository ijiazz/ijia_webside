import { DbPool } from "@ijia/data/dbclient";
import { spawn, ChildProcess } from "node:child_process";

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
  connectDb() {}
}
