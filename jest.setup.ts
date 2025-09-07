import { toMatchImageSnapshot } from "jest-image-snapshot";
import * as UPNG from "upng-js";

function toMatchTextureSnapshot(
    this: jest.MatcherContext,
    texture: any,
    options?: any,
) {
    try {
        // Try to detect our Texture type: must have width, height, and read()
        if (
            !texture ||
            typeof texture !== "object" ||
            !texture.width ||
            !texture.height ||
            !texture.read
        ) {
            return (toMatchImageSnapshot as any).call(this, texture, options);
        }

        const width: number = texture.width;
        const height: number = texture.height;
        const rgba: Uint8Array = texture.read();

        // upng expects an array of ArrayBuffers for frames
        const imageData: ArrayBuffer = UPNG.encode(
            [rgba.buffer as ArrayBuffer],
            width,
            height,
            0,
        );

        // Delegate to jest-image-snapshot matcher using the imported function
        const result = (toMatchImageSnapshot as any).call(
            this,
            imageData,
            options,
        );

        return result;
    } catch (e: any) {
        return {
            pass: false,
            message: () => `toMatchTextureSnapshot failed: ${e?.message || e}`,
        };
    }
}

expect.extend({
    toMatchImageSnapshot,
});

expect.extend({});
