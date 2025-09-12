import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

// Library build with Vite (ESM + CJS), sourcemaps and type definitions.
export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "src", "index.ts"),
            formats: ["es", "cjs"],
            fileName: format => (format === "cjs" ? "index.cjs" : "index.js"),
        },
        outDir: resolve(__dirname, "lib"),
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            // Ensure no externalization issues; keep dependencies external if any appear later
            external: [],
        },
    },
    plugins: [
        dts({
            tsconfigPath: resolve(__dirname, "tsconfig.lib.json"),
            outDir: resolve(__dirname, "lib"),
            copyDtsFiles: true,
            // Do not insert types references into source files; just emit d.ts next to outputs
            insertTypesEntry: true,
            // Respect includes/excludes from tsconfig
            include: ["src"],
            exclude: ["src/**/*.test.ts"],
        }),
    ],
});
