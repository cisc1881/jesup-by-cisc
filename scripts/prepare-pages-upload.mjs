import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";

const source = resolve("dist");
const target = resolve("dist-pages-upload");

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, {
  recursive: true,
  filter: (path) => path !== resolve(source, "_worker.js"),
});

// The Nitro Pages preset emits a directory of Worker modules. Cloudflare's
// dashboard upload needs one root-level _worker.js file instead.
await build({
  entryPoints: [resolve(source, "_worker.js/index.js")],
  outfile: resolve(target, "_worker.js"),
  bundle: true,
  format: "esm",
  platform: "neutral",
  external: ["node:*"],
  treeShaking: false,
  ignoreAnnotations: true,
  logLevel: "warning",
});

console.log(`Cloudflare Pages direct-upload files are ready in ${target}`);
