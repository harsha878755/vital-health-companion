import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "vital-production-content-security-policy",
      apply: "build",
      transformIndexHtml(html) {
        const policy = [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "frame-src 'none'",
          "form-action 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https:",
          "media-src 'self' blob:",
          "connect-src 'self'"
        ].join("; ");
        return html.replace("</head>", `<meta http-equiv="Content-Security-Policy" content="${policy}" />\n  </head>`);
      }
    }
  ],
  server: {
    port: 5173,
    watch: {
      // Reference photos are static assets and can be locked by image viewers on Windows.
      // Excluding them prevents Vite's dev watcher from crashing with EBUSY.
      ignored: ["**/public/pill-references/**"]
    },
    proxy: {
      "/api": "http://127.0.0.1:5055"
    }
  },
  preview: {
    port: 5186,
    proxy: {
      "/api": "http://127.0.0.1:5055"
    }
  }
});
