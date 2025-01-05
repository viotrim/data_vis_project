import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  base: process.env.NODE_ENV === "production" ? "/data_vis_project/" : "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  json: {
    // 支持导入JSON文件
    namedExports: true,
    stringify: false,
  },
});
