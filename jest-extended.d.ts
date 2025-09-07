import "jest-image-snapshot";

declare global {
    namespace jest {
        interface Matchers<R> {
            toMatchImageSnapshot(): R;
        }
    }
}

// Extend Jest's expect with the toMatchImageSnapshot matcher for ArrayBuffer
declare global {
    namespace jest {
        interface Expect {
            toMatchImageSnapshot: (options?: any) => any;
        }
    }
}

export {};
