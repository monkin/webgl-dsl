import "vitest";

// Custom matcher registered in vitest.setup.ts (backed by jest-image-snapshot).
interface CustomMatchers<R = unknown> {
    toMatchImageSnapshot(options?: unknown): R;
}

declare module "vitest" {
    interface Matchers<T = any> extends CustomMatchers<T> {}
}
