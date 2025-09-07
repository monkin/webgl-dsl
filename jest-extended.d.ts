import "jest-image-snapshot";

// Augment Jest matchers to include toMatchImageSnapshot from jest-image-snapshot
// Works with @types/jest v29 where the namespace is jest and Matchers is generic
declare global {
    namespace jest {
        interface Matchers<R> {
            toMatchImageSnapshot(options?: any): R;
        }
    }
}

export {};
