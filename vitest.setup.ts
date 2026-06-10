import { toMatchImageSnapshot } from "jest-image-snapshot";
import * as UPNG from "upng-js";
import { expect } from "vitest";

// Extend `toMatchImageSnapshot` to also accept our `Texture`/`Gl` objects:
// read their pixels, encode a PNG, then delegate to jest-image-snapshot.
function toMatchTextureSnapshot(this: any, texture: any, options?: any) {
    try {
        // Detect our renderable types: must expose width, height, and read().
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

        const imageData: ArrayBuffer = UPNG.encode(
            [rgba.buffer as ArrayBuffer],
            width,
            height,
            0,
        );

        return (toMatchImageSnapshot as any).call(this, imageData, options);
    } catch (e: any) {
        return {
            pass: false,
            message: () => `toMatchTextureSnapshot failed: ${e?.message || e}`,
        };
    }
}

expect.extend({
    toMatchImageSnapshot: toMatchTextureSnapshot as any,
});
