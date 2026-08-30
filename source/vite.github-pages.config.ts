import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const ROOT_ASSET_DIRS = [
  "VR180",
  "case-shop",
  "cover",
  "data",
  "inattentive-assets",
  "videos",
];

function githubPagesPaths(): Plugin {
  return {
    name: "github-pages-paths",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk") continue;
        for (const directory of ROOT_ASSET_DIRS) {
          output.code = output.code.replaceAll(`/${directory}/`, `./${directory}/`);
        }
        output.code = output.code.replaceAll("/api/", "./api/");
      }
    },
    async closeBundle() {
      const dataDirectory = resolve("dist-pages/data");
      for (const filename of await readdir(dataDirectory)) {
        if (!filename.endsWith(".json")) continue;
        const dataPath = resolve(dataDirectory, filename);
        let data = await readFile(dataPath, "utf8");
        for (const directory of ROOT_ASSET_DIRS) {
          data = data.replaceAll(`/${directory}/`, `./${directory}/`);
        }
        await writeFile(dataPath, data);
      }

      const viewerPath = resolve("dist-pages/VR180/viewer.js");
      const viewer = await readFile(viewerPath, "utf8");
      await writeFile(
        viewerPath,
        viewer
          .replaceAll('"/data/', '"../data/')
          .replaceAll('"/VR180/index.html', '"./index.html')
          .replaceAll('`/VR180/index.html', '`./index.html'),
      );
    },
  };
}

export default defineConfig({
  root: "github-pages",
  envDir: "..",
  base: "./",
  publicDir: "../public",
  plugins: [react(), githubPagesPaths()],
  build: {
    outDir: "../dist-pages",
    emptyOutDir: true,
  },
});
