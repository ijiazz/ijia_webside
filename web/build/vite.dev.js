import { createServer, build } from "vite";
import fs from "node:fs/promises";
import path from "node:path";
import inquirer from "inquirer";

const configFile = await getSite();
console.log("使用配置文件：", path.relative(".", configFile));

const server = await createServer({
  configFile: configFile,
});
await server.listen();

server.printUrls();
server.bindCLIShortcuts({ print: true });

async function selectSites() {
  const dirs = await fs.readdir("./sites");
  const promises = dirs.map(async (site) => {
    const configFile = path.resolve("./sites", site, "vite.config.ts");
    const isFile = await fs.stat(configFile).then(
      (s) => s.isFile(),
      () => false,
    );
    if (!isFile) return;
    return site;
  });
  const configList = await Promise.all(promises);
  return configList.filter((item) => item);
}
async function getSite() {
  const args = process.argv.slice(2);
  let siteName = args[0];
  if (!siteName) {
    const sites = await selectSites();
    const selected = await inquirer.prompt([
      {
        choices: sites,
        message: "选择站点",
        type: "select",
        name: "site",
      },
    ]);
    siteName = selected.site;
  }
  return path.resolve("sites", siteName, "vite.config.ts");
}
