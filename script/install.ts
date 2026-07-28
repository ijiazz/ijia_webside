const projectDirs: (string | { dir: string; command: string[] })[] = [
  ".",
  "web_dto",
  "web_api",
  "web",
  { dir: "e2e", command: ["pnpm", "install", "--frozen-lockfile"] },
];
for (const cwd of projectDirs) {
  if (typeof cwd === "string") {
    install(cwd);
  } else {
    install(cwd.dir, cwd.command);
  }
}
function install(cwd: string, command: string[] = ["deno", "install", "--frozen"]) {
  console.log(command.join(" ") + " in " + cwd);
  const status = Deno.spawnAndWaitSync(command[0], {
    args: command.slice(1),
    cwd,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  if (!status.success) {
    Deno.exit(status.code);
  }
}
