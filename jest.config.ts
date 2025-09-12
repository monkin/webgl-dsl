import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest/presets/js-with-ts-esm",
    moduleFileExtensions: ["ts", "tsx", "js"],
    transform: {
        "^.+\\.(ts|tsx|js)$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: "tsconfig.jest.json",
            },
        ],
    },
    testMatch: ["<rootDir>/src/**/*.test.(ts|tsx)"],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    extensionsToTreatAsEsm: [".ts", ".tsx"],
};

export default config;
