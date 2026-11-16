import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // Listen on the local network too, so phones on the same Wi-Fi can open the
  // dev server (Vite prints the "Network:" link). Only affects `vite dev`.
  server: { host: true },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    nitro(),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
