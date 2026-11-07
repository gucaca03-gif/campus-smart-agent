const path = require("path");
const fs = require("fs");
const esbuild = require("esbuild");

const root = path.resolve(__dirname, "..");
const jsEntry = path.join(root, "web", "static", "js", "app.js");
const jsOut = path.join(root, "web", "static", "js", "app.bundle.js");
const cssEntry = path.join(root, "web", "static", "css", "app.css");
const cssOut = path.join(root, "web", "static", "css", "app.bundle.css");

esbuild.buildSync({
  entryPoints: [jsEntry],
  bundle: true,
  minify: true,
  format: "esm",
  target: ["es2020"],
  legalComments: "none",
  outfile: jsOut,
});

esbuild.buildSync({
  entryPoints: [cssEntry],
  minify: true,
  target: ["es2020"],
  legalComments: "none",
  outfile: cssOut,
});

const kb = (p) => Math.round(fs.statSync(p).size / 1024);
console.log(`built ${path.basename(jsOut)} ${kb(jsOut)} KB, ${path.basename(cssOut)} ${kb(cssOut)} KB`);