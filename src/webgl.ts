import { command } from "./command";
import { ProgramSource, SourceConfig, TypeMap } from "./dsl";
import { Disposable, uses } from "./disposable";
import { Settings, SettingsCache } from "./settings";
import {
    ALIASED_POINT_SIZE_RANGE,
    ARRAY_BUFFER,
    CLAMP_TO_EDGE,
    COLOR_ATTACHMENT0,
    COLOR_BUFFER_BIT,
    DEPTH_ATTACHMENT,
    DEPTH_BUFFER_BIT,
    DEPTH_COMPONENT16,
    ELEMENT_ARRAY_BUFFER,
    FRAMEBUFFER,
    RENDERBUFFER,
    TEXTURE_2D,
    TEXTURE_MAG_FILTER,
    TEXTURE_MIN_FILTER,
    TEXTURE_WRAP_S,
    TEXTURE_WRAP_T,
    UNPACK_FLIP_Y_WEBGL,
    UNSIGNED_BYTE,
    UNSIGNED_SHORT,
} from "./consts";
import {
    BufferUsage,
    ErrorCode,
    PixelFormat,
    PrimitivesType,
    ShaderType,
    TextureFilter,
    TextureFormat,
} from "./enums";
import { Program, Shader } from "./program";
import WithoutPrecision = TypeMap.WithoutPrecision;

/**
 * The main class of this library. It provides access to WebGL context.
 */
export class Gl implements Disposable {
    readonly handle: WebGLRenderingContext;
    readonly instancedArraysExtension: ANGLE_instanced_arrays;
    readonly srgbExtension: EXT_sRGB;
    readonly minMaxExtension: EXT_blend_minmax;

    private readonly settingsCache = SettingsCache.initial();

    constructor(
        ...source:
            | [HTMLCanvasElement, WebGLContextAttributes?]
            | [WebGLRenderingContext]
    ) {
        const [a1, a2] = source;
        if (
            typeof HTMLCanvasElement !== "undefined" &&
            a1 instanceof HTMLCanvasElement
        ) {
            this.handle = a1.getContext("webgl", a2)!;
        } else {
            this.handle = a1 as WebGLRenderingContext;
        }

        this.instancedArraysExtension = this.handle.getExtension(
            "ANGLE_instanced_arrays",
        )!;

        this.minMaxExtension = this.handle.getExtension("EXT_blend_minmax")!;

        this.srgbExtension = this.handle.getExtension("EXT_sRGB")!;
    }

    /**
     * Get the width of the drawing buffer.
     */
    get width() {
        return this.handle.drawingBufferWidth;
    }

    /**
     * Get the height of the drawing buffer.
     */
    get height() {
        return this.handle.drawingBufferHeight;
    }

    isContextLost() {
        return this.handle.isContextLost();
    }

    getPointSizeRange(): [number, number] {
        return this.handle.getParameter(ALIASED_POINT_SIZE_RANGE);
    }

    clearColorBuffer(): this {
        this.handle.clear(COLOR_BUFFER_BIT);
        return this;
    }

    clearDepthBuffer(): this {
        this.handle.clear(DEPTH_BUFFER_BIT);
        return this;
    }

    /**
     * Clear color and depth buffer
     */
    clearBuffers(): this {
        this.handle.clear(COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT);
        return this;
    }

    /**
     * Read pixels from a drawing buffer into an array buffer
     */
    read(format: PixelFormat = PixelFormat.Rgba): Uint8Array {
        const { width, height } = this;

        const bytes = new Uint8Array(
            width * height * PixelFormat.getChannelsCount(format),
        );

        this.settings()
            .viewport(0, 0, width, height)
            .apply(() => {
                this.handle.readPixels(
                    0,
                    0,
                    width,
                    height,
                    format,
                    UNSIGNED_BYTE,
                    bytes,
                );
            });

        return bytes;
    }

    drawArrays(primitivesType: PrimitivesType, verticesCount: number): this {
        this.handle.drawArrays(primitivesType, 0, verticesCount);
        return this;
    }

    drawsElements(primitivesType: PrimitivesType, elementsCount: number): this {
        this.handle.drawElements(
            primitivesType,
            elementsCount,
            UNSIGNED_SHORT,
            0,
        );
        return this;
    }

    drawInstancedArrays(
        primitivesType: PrimitivesType,
        verticesCount: number,
        instancesCount: number,
    ): this {
        this.instancedArraysExtension.drawArraysInstancedANGLE(
            primitivesType,
            0,
            verticesCount,
            instancesCount,
        );
        return this;
    }

    drawsInstancedElements(
        primitivesType: PrimitivesType,
        elementsCount: number,
        instancesCount: number,
    ): this {
        this.instancedArraysExtension.drawElementsInstancedANGLE(
            primitivesType,
            elementsCount,
            UNSIGNED_SHORT,
            0,
            instancesCount,
        );
        return this;
    }

    /**
     * Create an empty settings object
     */
    settings() {
        return new Settings(this, this.settingsCache);
    }

    /**
     * Create texture with specified parameters
     */
    texture(config: TextureConfig) {
        return new Texture(this, config);
    }

    /**
     * Create depth buffer with specified width and height
     * @param width Depth buffer width
     * @param height Depth buffer height
     */
    renderBuffer(width: number, height: number) {
        return new RenderBuffer(this, width, height);
    }

    /**
     * Create a frame buffer that can be used as a render target.
     * @param texture The texture to attach to the frame buffer.
     * @param renderBuffer Depth buffer to attach to the frame buffer.
     */
    frameBuffer(texture: Texture, renderBuffer?: RenderBuffer) {
        return new FrameBuffer(this, texture, renderBuffer);
    }

    arrayBuffer(
        data: Float32Array | number[] | null = null,
        usage: BufferUsage = BufferUsage.Dynamic,
    ) {
        return new ArrayBuffer(this, data, usage);
    }

    elementsBuffer(
        data: Uint16Array | number[] | null = null,
        usage: BufferUsage = BufferUsage.Dynamic,
    ) {
        return new ElementsBuffer(this, data, usage);
    }

    /**
     * Create a program with a specified vertex and fragment shader source
     */
    program(vertex: string, fragment: string) {
        return uses(
            () => new Shader(this, ShaderType.Vertex, vertex),
            () => new Shader(this, ShaderType.Fragment, fragment),
            (vertex, fragment) => {
                return new Program(this, vertex, fragment);
            },
        );
    }

    /**
     * The main function of this library, creates a command with specified parameters and shaders
     * @param primitivesType Type of primitives to draw
     * @param configOrSource Description of attributes, uniforms, varyings, and shaders
     */
    command<
        Uniforms extends TypeMap,
        Attributes extends TypeMap,
        Instances extends TypeMap,
        Varyings extends TypeMap = {},
    >(
        primitivesType: PrimitivesType,
        configOrSource:
            | SourceConfig<Uniforms, Attributes, Instances, Varyings>
            | ProgramSource<
                  WithoutPrecision<Uniforms>,
                  WithoutPrecision<Attributes>,
                  WithoutPrecision<Instances>
              >,
    ) {
        return command(this, primitivesType, configOrSource);
    }

    hasSrgbExtension() {
        return !!this.srgbExtension;
    }

    getErrorCode(): ErrorCode | number {
        return this.handle.getError();
    }

    /**
     * Destroy WebGL context
     */
    dispose() {
        const ex = this.handle.getExtension("WEBGL_lose_context");
        if (ex) {
            ex.loseContext();
        }
    }
}

export type TextureConfig = {
    /**
     * @default TextureFormat.RGBA
     */
    format?: TextureFormat;
    /**
     * @default TextureFilter.NEAREST
     */
    filter?: TextureFilter;
} & (
    | {
          image: TexImageSource;
      }
    | {
          data: ArrayBufferView;
          width: number;
          height: number;
      }
    | {
          width: number;
          height: number;
      }
);

/**
 * 2D texture
 */
export class Texture {
    readonly handle: WebGLTexture;
    readonly width: number;
    readonly height: number;
    readonly format: TextureFormat;
    readonly filter: TextureFilter;

    constructor(
        public readonly gl: Gl,
        config: TextureConfig,
    ) {
        this.handle = gl.handle.createTexture()!;

        this.format = config.format || TextureFormat.Rgba;
        this.filter = config.filter || TextureFilter.Nearest;

        if ("image" in config) {
            this.width =
                config.image instanceof HTMLImageElement
                    ? config.image.naturalWidth
                    : config.image instanceof VideoFrame
                      ? config.image.codedWidth
                      : config.image.width;
            this.height =
                config.image instanceof HTMLImageElement
                    ? config.image.naturalHeight
                    : config.image instanceof VideoFrame
                      ? config.image.codedHeight
                      : config.image.height;
        } else {
            this.width = config.width;
            this.height = config.height;
        }

        gl.settings()
            .activeTexture(0)
            .texture(0, this)
            .apply(() => {
                gl.handle.pixelStorei(UNPACK_FLIP_Y_WEBGL, 1);
                gl.handle.texParameteri(
                    TEXTURE_2D,
                    TEXTURE_MAG_FILTER,
                    this.filter,
                );
                gl.handle.texParameteri(
                    TEXTURE_2D,
                    TEXTURE_MIN_FILTER,
                    this.filter,
                );
                gl.handle.texParameteri(
                    TEXTURE_2D,
                    TEXTURE_WRAP_S,
                    CLAMP_TO_EDGE,
                );
                gl.handle.texParameteri(
                    TEXTURE_2D,
                    TEXTURE_WRAP_T,
                    CLAMP_TO_EDGE,
                );

                if ("image" in config) {
                    gl.handle.texImage2D(
                        TEXTURE_2D,
                        0,
                        this.format,
                        this.format,
                        UNSIGNED_BYTE,
                        config.image,
                    );
                } else {
                    gl.handle.texImage2D(
                        TEXTURE_2D,
                        0,
                        this.format,
                        this.width,
                        this.height,
                        0, // border
                        this.format,
                        UNSIGNED_BYTE,
                        "data" in config ? config.data : null,
                    );
                }
            });
    }

    /**
     * Read pixels from the texture into an array buffer
     */
    read(format: PixelFormat = PixelFormat.Rgba): Uint8Array {
        const bytes = new Uint8Array(
            this.width * this.height * PixelFormat.getChannelsCount(format),
        );

        this.gl
            .settings()
            .renderTarget(this)
            .viewport(0, 0, this.width, this.height)
            .apply(() => {
                this.gl.handle.readPixels(
                    0,
                    0,
                    this.width,
                    this.height,
                    format,
                    UNSIGNED_BYTE,
                    bytes,
                );
            });

        return bytes;
    }

    setFilter(filter: TextureFilter) {
        this.gl.handle.texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, filter);
        this.gl.handle.texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, filter);
    }

    dispose() {
        this.gl.handle.deleteTexture(this.handle);
    }
}

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

/**
 * Depth buffer
 */
export class RenderBuffer implements Disposable {
    public readonly handle: WebGLRenderbuffer;

    constructor(
        public readonly gl: Gl,
        private widthValue: number,
        private heightValue: number,
    ) {
        this.handle = gl.handle.createRenderbuffer()!;
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

    dispose() {
        this.gl.handle.deleteRenderbuffer(this.handle);
    }
}

/**
 * Array of vertices
 */
export class ArrayBuffer implements Disposable {
    readonly handle: WebGLBuffer;

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

    dispose() {
        this.gl.handle.deleteBuffer(this.handle);
    }
}

/**
 * Array of indices
 */
export class ElementsBuffer implements Disposable {
    public readonly handle: WebGLBuffer;

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

    dispose() {
        this.gl.handle.deleteBuffer(this.handle);
    }
}
