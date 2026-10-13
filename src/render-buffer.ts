import { DEPTH_COMPONENT16, RENDERBUFFER } from "./consts";
import { Gl } from "./gl";

/**
 * Depth buffer
 */
export class RenderBuffer implements Disposable {
    public readonly handle: WebGLRenderbuffer;
    /** The context generation it was made in; see `Gl.isDead`. */
    private readonly generation: number;

    constructor(
        public readonly gl: Gl,
        private widthValue: number,
        private heightValue: number,
    ) {
        this.handle = gl.handle.createRenderbuffer()!;
        this.generation = gl.generation;
        gl.settings()
            .renderBuffer(this)
            .apply(() => {
                gl.handle.renderbufferStorage(
                    RENDERBUFFER,
                    DEPTH_COMPONENT16,
                    widthValue,
                    heightValue,
                );
            });
    }

    get width() {
        return this.widthValue;
    }

    get height() {
        return this.heightValue;
    }

    resize(width: number, height: number): this {
        const { gl } = this;
        if (width !== this.width || height !== this.height) {
            this.widthValue = width;
            this.heightValue = height;
            gl.settings()
                .renderBuffer(this)
                .apply(() => {
                    gl.handle.renderbufferStorage(
                        RENDERBUFFER,
                        DEPTH_COMPONENT16,
                        width,
                        height,
                    );
                });
        }
        return this;
    }

    [Symbol.dispose]() {
        if (!this.gl.isDead(this.generation)) {
            this.gl.handle.deleteRenderbuffer(this.handle);
        }
    }
}
