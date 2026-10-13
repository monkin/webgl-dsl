import { BufferUsage } from "./enums";
import { ELEMENT_ARRAY_BUFFER } from "./consts";
import { Gl } from "./gl";

/**
 * Array of indices
 */
export class ElementsBuffer implements Disposable {
    public readonly handle: WebGLBuffer;
    /** The context generation it was made in; see `Gl.isDead`. */
    private readonly generation: number;

    private lengthValue = 0;

    public get length() {
        return this.lengthValue;
    }

    constructor(
        public readonly gl: Gl,
        data: Uint8Array | Uint16Array | number[] | null = null,
        /**
         * @default BufferUsage.Dynamic
         */
        private readonly usage: BufferUsage = BufferUsage.Dynamic,
    ) {
        this.handle = gl.handle.createBuffer()!;
        this.generation = gl.generation;
        data && this.setContent(data);
    }

    setContent(data: Uint8Array | Uint16Array | number[]) {
        const content =
            data instanceof Uint8Array || data instanceof Uint16Array
                ? data
                : new Uint16Array(data);
        this.lengthValue = content.length;

        const gl = this.gl;

        gl.settings()
            .elementsBuffer(this)
            .apply(() => {
                gl.handle.bufferData(ELEMENT_ARRAY_BUFFER, content, this.usage);
            });

        return this;
    }

    [Symbol.dispose]() {
        if (!this.gl.isDead(this.generation)) {
            this.gl.handle.deleteBuffer(this.handle);
        }
    }
}
