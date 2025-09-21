import { Disposable } from "./disposable";
import { RenderBuffer } from "./render-buffer";
import {
    COLOR_ATTACHMENT0,
    DEPTH_ATTACHMENT,
    FRAMEBUFFER,
    RENDERBUFFER,
    TEXTURE_2D,
} from "./consts";
import { Gl } from "./webgl";
import { Texture } from "./texture";

/**
 * Rendering target. It contains target texture and optional depth buffer.
 */
export class FrameBuffer implements Disposable {
    readonly handle: WebGLFramebuffer;

    constructor(
        public readonly gl: Gl,
        public readonly colorBuffer: Texture,
        public readonly depthBuffer?: RenderBuffer,
    ) {
        this.handle = gl.handle.createFramebuffer()!;
        gl.settings()
            .frameBuffer(this)
            .apply(() => {
                gl.handle.framebufferTexture2D(
                    FRAMEBUFFER,
                    COLOR_ATTACHMENT0,
                    TEXTURE_2D,
                    colorBuffer.handle,
                    0,
                );
                depthBuffer &&
                    gl.handle.framebufferRenderbuffer(
                        FRAMEBUFFER,
                        DEPTH_ATTACHMENT,
                        RENDERBUFFER,
                        depthBuffer.handle,
                    );
            });
    }

    dispose() {
        this.gl.handle.deleteFramebuffer(this.handle);
    }
}
