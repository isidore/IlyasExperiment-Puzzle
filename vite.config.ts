import { defineConfig } from "vite";

// GitHub Pages serves the site from /<repo-name>/, so built asset paths must be relative.
export default defineConfig({
  base: "./",
});
