import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";
import {readFileSync} from "node:fs";
const repo = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")).repository.url; // footer link; forks edit package.json
// the version Release Please maintains (shown in the footer)
const version = JSON.parse(readFileSync(new URL("./.release-please-manifest.json", import.meta.url), "utf8"))["."];
// relative base: the build works under /<repo>/ on GitHub Pages and from any static folder
export default defineConfig({base: "./", define: {__APP_VERSION__: JSON.stringify(version), __REPO_URL__: JSON.stringify(repo)}, plugins: [vue({template: {compilerOptions: {whitespace: "preserve"}}})], test: {include: ["src/**/*.test.js"], environment: "node"}, build: {target: ["es2019", "safari14"]}});
