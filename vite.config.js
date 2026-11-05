import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";
// relative base: the build works under /<repo>/ on GitHub Pages and from any static folder
export default defineConfig({base: "./", plugins: [vue({template: {compilerOptions: {whitespace: "preserve"}}})], build: {target: ["es2019", "safari14"]}});
