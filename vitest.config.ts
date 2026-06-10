import { defineConfig } from "vitest/config";

// Tests run on the `gl` native module, so a Node environment is required.
export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["src/**/*.test.ts"],
        setupFiles: ["./vitest.setup.ts"],
    },
});
