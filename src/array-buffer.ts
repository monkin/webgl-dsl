import { BufferUsage } from "./enums";
import { ARRAY_BUFFER } from "./consts";
import { Gl } from "./gl";

/**
 * Array of vertices
 */
export class ArrayBuffer implements Disposable {
    readonly handle: WebGLBuffer;
    /** The context generation it was made in; see `Gl.isDead`. */
    private readonly generation: number;

    private lengthValue = 0;

    public get length() {
        return this.lengthValue;
    }

    constructor(
        readonly gl: Gl,
        data: Float32Array | number[] | null = null,
        /**
         * @default BufferUsage.Dynamic
         */
        private readonly usage: BufferUsage = BufferUsage.Dynamic,
    ) {
        this.handle = gl.handle.createBuffer()!;
        this.generation = gl.generation;
        data && this.setContent(data);
    }

    setContent(data: Float32Array | number[]) {
        const content =
            data instanceof Float32Array ? data : new Float32Array(data);
        this.lengthValue = content.length;

        const gl = this.gl;

        gl.settings()
            .arrayBuffer(this)
            .apply(() => {
                gl.handle.bufferData(ARRAY_BUFFER, content, this.usage);
            });

        return this;
    }

    [Symbol.dispose]() {
        if (!this.gl.isDead(this.generation)) {
            this.gl.handle.deleteBuffer(this.handle);
        }
    }
}
