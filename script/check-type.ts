const projectDirs = ["web_dto", "web_api", "web", "e2e"];

const failedProjectDirs: string[] = [];

for (const cwd of projectDirs) {
  console.log(`deno task check-type (${cwd})`);
  if (!checkType(cwd)) {
    failedProjectDirs.push(cwd);
  }
}

if (failedProjectDirs.length > 0) {
  console.error("\ncheck-type failed packages:");
  for (const cwd of failedProjectDirs) {
    console.error(`- ${cwd}`);
  }
  Deno.exit(1);
}

function checkType(cwd: string) {
  const output = new Deno.Command("deno", {
    args: ["task", "check-type"],
    cwd,
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  }).outputSync();

  if (!output.success) {
    printDiagnostics(output.stderr);
    printDiagnostics(output.stdout);
  }

  return output.success;
}

function printDiagnostics(output: Uint8Array) {
  const diagnostics = new TextDecoder().decode(output)
    .split(/\r?\n/)
    .filter((line) => {
      const plainLine = stripAnsi(line);
      return !plainLine.startsWith("Task ") && !plainLine.startsWith("Check ");
    })
    .join("\n")
    .trim();

  if (diagnostics.length > 0) {
    console.error(diagnostics);
  }
}

function stripAnsi(text: string) {
  return text.replaceAll(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
}
