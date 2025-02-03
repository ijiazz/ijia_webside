import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import fs from "node:fs/promises";
import packageJson from "../package.json" with { type: "json" };

const ps = spawn("git", ["log", "-n", "1"], { stdio: [null, "pipe", "inherit"] });
const stdout = Readable.toWeb(ps.stdout!);

const str = await Array.fromAsync(stdout.pipeThrough(new TextDecoderStream()).values()).then((items) => items.join(""));
const lines = str.split("\n");

const commitSha = lines[0].replace(/.+?\s/, "");
const date = lines[2].replace(/.+?\:\s+/, "");

const info: typeof packageJson.buildMeta = {
  commitSha: commitSha,
  commitDate: date,
};
Object.assign(packageJson.buildMeta, info);

console.log(info);
await fs.writeFile("package.json", JSON.stringify(packageJson, null, 2), "utf-8");
