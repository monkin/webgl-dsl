import { command } from "./command";
import { ProgramSource, SourceConfig, TypeMap } from "./dsl";
import { Disposable, uses } from "./disposable";
import { Settings, SettingsCache } from "./settings";
import {
    // clear bits
    DEPTH_BUFFER_BIT,
    COLOR_BUFFER_BIT,
    // buffers
    ARRAY_BUFFER,
    ELEMENT_ARRAY_BUFFER,
    // culling and toggles
    CULL_FACE,
    BLEND,
    DEPTH_TEST,
    SCISSOR_TEST,
    // point size
    ALIASED_POINT_SIZE_RANGE,

    // textures and pixel formats
    TEXTURE_MAG_FILTER,
    TEXTURE_MIN_FILTER,
    TEXTURE_WRAP_S,
    TEXTURE_WRAP_T,
    TEXTURE_2D,
    TEXTURE0,
    CLAMP_TO_EDGE,
    UNSIGNED_BYTE,
    // shader types and uniforms
    BOOL,
    FLOAT,
    FLOAT_VEC2,
    FLOAT_VEC3,
    FLOAT_VEC4,
    FLOAT_MAT2,
    FLOAT_MAT3,
    FLOAT_MAT4,
    SAMPLER_2D,
    COMPILE_STATUS,
    LINK_STATUS,
    // attribute queries
    ACTIVE_ATTRIBUTES,
    // framebuffer/renderbuffer
    FRAMEBUFFER,
    RENDERBUFFER,
    DEPTH_COMPONENT16,
    COLOR_ATTACHMENT0,
    DEPTH_ATTACHMENT,
    UNPACK_FLIP_Y_WEBGL,
    UNSIGNED_SHORT,
    ACTIVE_UNIFORMS,
} from "./consts";
import WithoutPrecision = TypeMap.WithoutPrecision;
import {
    FaceCulling,
    BlendEquation,
    DepthFunction,
    BlendFunction,
    TextureFilter,
    TextureFormat,
    PixelFormat,
    ShaderType,
    ErrorCode,
    BufferUsage,
    BufferTarget,
    PrimitivesType,
} from "./enums";

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

/**
 * Geometry or fragment shader.
 */
class Shader implements Disposable {
    readonly handle: WebGLShader;

    constructor(
        public readonly gl: Gl,
        public readonly type: ShaderType,
        public readonly source: string,
    ) {
        const handle = (this.handle = gl.handle.createShader(type)!);

        gl.handle.shaderSource(handle, source);
        gl.handle.compileShader(handle);
        if (gl.handle.getShaderParameter(handle, COMPILE_STATUS) === false) {
            throw new Error(
                `WebGL error '${gl.handle.getShaderInfoLog(handle)}' in '${source}'`,
            );
        }
    }

    dispose() {
        this.gl.handle.deleteShader(this.handle);
    }
}

export interface UniformRecord {
    location: WebGLUniformLocation;
    type: number;
    size: number;
}

export interface AttributeRecord {
    location: number;
    type: number;
    size: number;
}

export class Program implements Disposable {
    readonly handle: WebGLProgram;

    readonly uniforms: { [name: string]: UniformRecord } = {};
    readonly attributes: { [name: string]: AttributeRecord } = {};

    constructor(
        public readonly gl: Gl,
        public readonly vertex: Shader,
        public readonly fragment: Shader,
    ) {
        const handle = (this.handle = gl.handle.createProgram()!);
        gl.handle.attachShader(handle, vertex.handle);
        gl.handle.attachShader(handle, fragment.handle);
        gl.handle.linkProgram(handle);
        gl.handle.validateProgram(handle);
        if (gl.handle.getProgramParameter(handle, LINK_STATUS) === false) {
            throw new Error(
                gl.handle.getProgramInfoLog(handle) ||
                    `Program linking error:\n${vertex.source};\n${fragment.source}`,
            );
        }

        // uniforms
        const uniformsCount: number = gl.handle.getProgramParameter(
            handle,
            ACTIVE_UNIFORMS,
        );
        for (let i = 0; i < uniformsCount; i++) {
            const info = gl.handle.getActiveUniform(handle, i);
            if (info !== null) {
                this.uniforms[info.name] = {
                    type: info.type,
                    location: gl.handle.getUniformLocation(handle, info.name)!,
                    size: info.size,
                };
            }
        }

        // attributes
        const attributesCount = gl.handle.getProgramParameter(
            handle,
            ACTIVE_ATTRIBUTES,
        );
        for (let i = 0; i < attributesCount; i++) {
            const info = gl.handle.getActiveAttrib(handle, i);
            if (info != null) {
                this.attributes[info.name] = {
                    type: info.type,
                    location: i,
                    size: info.size,
                };
            }
        }
    }

    setUniform(name: string, value: number[]) {
        const { gl, uniforms } = this;
        const uniform = uniforms[name];
        if (uniform) {
            const { location, type } = uniform;
            gl.settings()
                .program(this)
                .apply(() => {
                    switch (type) {
                        case BOOL:
                            gl.handle.uniform1i(location, value[0] ? 1 : 0);
                            break;
                        case SAMPLER_2D:
                            gl.handle.uniform1iv(location, value);
                            break;
                        case FLOAT:
                            gl.handle.uniform1fv(location, value);
                            break;
                        case FLOAT_VEC2:
                            gl.handle.uniform2fv(location, value);
                            break;
                        case FLOAT_VEC3:
                            gl.handle.uniform3fv(location, value);
                            break;
                        case FLOAT_VEC4:
                            gl.handle.uniform4fv(location, value);
                            break;
                        case FLOAT_MAT2:
                            gl.handle.uniformMatrix2fv(location, false, value);
                            break;
                        case FLOAT_MAT3:
                            gl.handle.uniformMatrix3fv(location, false, value);
                            break;
                        case FLOAT_MAT4:
                            gl.handle.uniformMatrix4fv(location, false, value);
                            break;
                    }
                });
        }
    }

    setAttribute(
        name: string,
        buffer: ArrayBuffer,
        strideInFloats: number,
        offsetInFloats: number,
    ) {
        const attr = this.attributes[name];
        if (attr != null) {
            const { gl } = this;

            gl.settings()
                .arrayBuffer(buffer)
                .apply(() => {
                    gl.handle.vertexAttribPointer(
                        attr.location,
                        (() => {
                            switch (attr.type) {
                                case FLOAT:
                                    return 1;
                                case FLOAT_VEC2:
                                    return 2;
                                case FLOAT_VEC3:
                                    return 3;
                                case FLOAT_VEC4:
                                    return 4;
                                case FLOAT_MAT2:
                                    return 4;
                                case FLOAT_MAT3:
                                    return 9;
                                case FLOAT_MAT4:
                                    return 16;
                                default:
                                    throw new Error(
                                        `Invalid attribute type '${attr.type}'`,
                                    );
                            }
                        })(),
                        FLOAT,
                        false,
                        strideInFloats * 4,
                        offsetInFloats * 4,
                    );
                });
        } else {
            console.warn(`Attribute '${name}' not found`);
        }
    }

    dispose() {
        this.gl.handle.deleteProgram(this.handle);
    }
}
