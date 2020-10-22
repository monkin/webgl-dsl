import { Disposable, use, uses } from "./disposable";
import {
    GlEnum,
} from "./enums";

enum BlendEquation {
     Add = GlEnum.FUNC_ADD,
     Sub = GlEnum.FUNC_SUBTRACT,
     RSub = GlEnum.FUNC_REVERSE_SUBTRACT,
}

export enum DepthFunction {
    Never = GlEnum.NEVER,
    Less = GlEnum.LESS,
    Equal = GlEnum.EQUAL,
    LWqual = GlEnum.LEQUAL,
    Greater = GlEnum.GREATER,
    NotEqual = GlEnum.NOTEQUAL,
    GEqual = GlEnum.GEQUAL,
    Always = GlEnum.ALWAYS,
}

export enum BlendFunction {
    Zero = GlEnum.ZERO,
    One = GlEnum.ONE,
    SrcColor = GlEnum.SRC_COLOR,
    OneMinusSrcColor = GlEnum.ONE_MINUS_SRC_COLOR,
    DstColor = GlEnum.DST_COLOR,
    OneMinusDstColor = GlEnum.ONE_MINUS_DST_COLOR,
    SrcAlpha = GlEnum.SRC_ALPHA,
    OneMinusSrcAlpha = GlEnum.ONE_MINUS_SRC_ALPHA,
    DstAlpha = GlEnum.DST_ALPHA,
    OneMinusDstAlpha = GlEnum.ONE_MINUS_DST_ALPHA,
    SrcAlphaSaturate = GlEnum.SRC_ALPHA_SATURATE,
}

export enum TextureFilter {
    Nearest = GlEnum.NEAREST,
    Linear = GlEnum.LINEAR,
}

export enum TextureFormat {
    Alpha = GlEnum.ALPHA,
    Luminance = GlEnum.LUMINANCE,
    LuminanceAlpha = GlEnum.LUMINANCE_ALPHA,
    Rgb = GlEnum.RGB,
    Rgba = GlEnum.RGBA,
}

export enum ShaderType {
    Vertex = GlEnum.VERTEX_SHADER,
    Fragment = GlEnum.FRAGMENT_SHADER,
}

export const texturesCount = 16

export enum ErrorCode {
    NoError = GlEnum.NO_ERROR,
    InvalidEnum = GlEnum.INVALID_ENUM,
    InvalidValue = GlEnum.INVALID_VALUE,
    InvalidOperation = GlEnum.INVALID_OPERATION,
    OutOfMemory = GlEnum.OUT_OF_MEMORY,
}

export enum BufferUsage {
    /**
     * The data store contents will be modified once and used at most a few times.
     */
    Stream = GlEnum.STREAM_DRAW,
    /**
     * The data store contents will be modified once and used many times.
     */
    Static = GlEnum.STATIC_DRAW,
    /**
     * The data store contents will be modified repeatedly and used many times.
     */
    Dynamic = GlEnum.DYNAMIC_DRAW,
}

export enum BufferTarget {
    Array = GlEnum.ARRAY_BUFFER,
    Elements = GlEnum.ELEMENT_ARRAY_BUFFER,
}

export enum PrimitivesType {
    Points = GlEnum.POINTS,
    Lines = GlEnum.LINES,
    LineStrip = GlEnum.LINE_STRIP,
    LineLoop = GlEnum.LINE_LOOP,
    Triangles = GlEnum.TRIANGLES,
    TriangleStrip = GlEnum.TRIANGLE_STRIP,
    TriangleFan = GlEnum.TRIANGLE_FAN,
}

export class Gl implements Disposable {
    readonly handle: WebGLRenderingContext;
    readonly instancedArrays: ANGLE_instanced_arrays;
    
    private readonly settingsCache = SettingsCache.initial();

    constructor(source: HTMLCanvasElement, settings: WebGLContextAttributes = {}) {
        this.handle = source.getContext("webgl", settings)!;
        this.instancedArrays = this.handle.getExtension("ANGLE_instanced_arrays")!;
    }

    isContextLost() {
        return this.handle.isContextLost();
    }

    getPointSizeRange(): [number, number] {
        return this.handle.getParameter(GlEnum.ALIASED_POINT_SIZE_RANGE);
    }
    cleanColorBuffer(): this {
        this.handle.clear(GlEnum.COLOR_BUFFER_BIT);
        return this
    }
    cleanDepthBuffer(): this {
        this.handle.clear(GlEnum.DEPTH_BUFFER_BIT);
        return this;
    }
    /**
     * Clear color and depth buffer
     */
    cleanBuffers(): this {
        this.handle.clear(GlEnum.COLOR_BUFFER_BIT | GlEnum.DEPTH_BUFFER_BIT);
        return this;
    }

    drawArrays(primitivesType: PrimitivesType, verticesCount: number): this {
        this.handle.drawArrays(primitivesType, 0, verticesCount);
        return this;
    }
    drawsElements(primitivesType: PrimitivesType, elementsCount: number): this {
        this.handle.drawElements(primitivesType, elementsCount, GlEnum.UNSIGNED_SHORT, 0);
        return this;
    }
    drawInstancedArrays(primitivesType: PrimitivesType, verticesCount: number, instancesCount: number): this {
        this.instancedArrays.drawArraysInstancedANGLE(primitivesType, 0, verticesCount, instancesCount);
        return this;
    }
    drawsInstancedElements(primitivesType: PrimitivesType, elementsCount: number, instancesCount: number): this {
        this.instancedArrays.drawElementsInstancedANGLE(primitivesType, elementsCount, GlEnum.UNSIGNED_SHORT, 0, instancesCount);
        return this;
    }

    settings() {
        return new Settings(this, this.settingsCache);
    }

    texture(config: TextureConfig) {
        return new Texture(this, config);
    }

    arrayBuffer(data: Float32Array | number[] | null = null, usage: BufferUsage = BufferUsage.Dynamic) {
        return new ArrayBuffer(this, data, usage);
    }
    elementsBuffer(data: Uint16Array | number[] | null = null, usage: BufferUsage = BufferUsage.Dynamic) {
        return new ElementsBuffer(this, data, usage);
    }

    program(vertex: string, fragment: string) {
        return uses(
            () => new Shader(this, ShaderType.Vertex, vertex),
            () => new Shader(this, ShaderType.Fragment, fragment),
        )((vertex, fragment) => {
            return new Program(this, vertex, fragment);
        });
    }

    dispose() {
        const ex = this.handle.getExtension("WEBGL_lose_context");
        if (ex) {
            ex.loseContext();
        }
    }
}

interface SettingsCache {
    blend: boolean;
    viewport: [number, number, number, number];
    scissorTest: boolean;
    scissorBox: [number, number, number, number];
    depthTest: boolean;
    depthFunction: DepthFunction;
    clearDepth: number;
    lineWidth: number;
    blendEquation: [BlendEquation, BlendEquation];
    blendFunction: [BlendFunction, BlendFunction, BlendFunction, BlendFunction];
    clearColor: [number, number, number, number];
    activeTexture: number;
    textures: Map<number, Texture>;
    arrayBuffer: ArrayBuffer | null;
    elementsBuffer: ElementsBuffer | null;
    program: Program | null;
    enabledAttributes: Set<number>;
    instancedAttributes: Set<number>;
    renderBuffer: RenderBuffer | null;
    frameBuffer: FrameBuffer | null;
}

namespace SettingsCache {
    export const initial =  (): SettingsCache => ({
        blend: false,
        viewport: [0, 0, 0, 0],
        scissorTest: false,
        scissorBox: [0, 0, 0, 0],
        depthTest: false,
        depthFunction: DepthFunction.Less,
        clearDepth: 1.0,
        lineWidth: 1.0,
        blendEquation: [BlendEquation.Add, BlendEquation.Add],
        blendFunction: [
            BlendFunction.One,
            BlendFunction.Zero,
            BlendFunction.One,
            BlendFunction.Zero,
        ],
        clearColor: [0, 0, 0, 0],
        activeTexture: 0,
        textures: new Map(),
        arrayBuffer: null,
        elementsBuffer: null,
        program: null,
        enabledAttributes: new Set(),
        instancedAttributes: new Set(),
        renderBuffer: null,
        frameBuffer: null,
    });
}

export class Settings {
    constructor(
        public readonly gl: Gl,
        private readonly cache: SettingsCache,
        public readonly apply: <T>(callback: () => T) => T = (callback) => callback(),
    ) {

    }

    private static cached<T>({ read, write, equals, apply }: {
        read: (cache: SettingsCache) => T,
        write: (cahe: SettingsCache, value: T) => void,
        equals: (v1: T, v2: T) => boolean,
        apply: (gl: Gl, value: T) => void,
    }) {
        return function (this: Settings, value: T) {
            return this.then(new Settings(this.gl, this.cache, <R>(callback: () => R): R => {
                const cached = read(this.cache);
                if (equals(cached, value)) {
                    return callback();
                } else {
                    try {
                        write(this.cache, value);
                        apply(this.gl, value);
                        return callback();
                    } finally {
                        write(this.cache, cached);
                        apply(this.gl, cached);
                    }
                }
            }));
        };
    }

    then(settings: Settings) {
        return new Settings(this.gl, this.cache, (callback) => {
            return this.apply(() => {
                return settings.apply(callback);
            });
        });
    }

    blend = Settings.cached<boolean>({
        read: cache => cache.blend,
        write: (cache, value) => {
            cache.blend = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            if (value) {
                gl.handle.enable(GlEnum.BLEND);
            } else {
                gl.handle.disable(GlEnum.BLEND);
            }
        },
    });

    viewport = (() => {
        const setting = Settings.cached<[number, number, number, number]>({
            read: cache => cache.viewport,
            write: (cached, value) => {
                cached.viewport = value;
            },
            equals: (v1, v2) => v1.every((x, i) => x === v2[i]),
            apply: (gl, [x, y, width, heigth]) => {
                gl.handle.viewport(x, y, width, heigth);
            },
        });

        return function (this: Settings, x: number, y: number, width: number, height: number) {
            return setting.call(this, [x, y, width, height]);
        };
    })();

    scissorTest = Settings.cached<boolean>({
        read: cache => cache.scissorTest,
        write: (cache, value) => {
            cache.scissorTest = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            if (value) {
                gl.handle.enable(GlEnum.SCISSOR_TEST);
            } else {
                gl.handle.disable(GlEnum.SCISSOR_TEST);
            }
        },
    });

    scissorBox = (() => {
        const setting = Settings.cached<[number, number, number, number]>({
            read: cache => cache.scissorBox,
            write: (cached, value) => {
                cached.scissorBox = value;
            },
            equals: (v1, v2) => v1.every((x, i) => x === v2[i]),
            apply: (gl, [x, y, width, heigth]) => {
                gl.handle.scissor(x, y, width, heigth);
            },
        });

        return function (this: Settings, x: number, y: number, width: number, height: number) {
            return setting.call(this, [x, y, width, height]);
        };
    })();

    depthTest = Settings.cached<boolean>({
        read: cache => cache.depthTest,
        write: (cache, value) => {
            cache.depthTest = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            if (value) {
                gl.handle.enable(GlEnum.DEPTH_TEST);
            } else {
                gl.handle.disable(GlEnum.DEPTH_TEST);
            }
        },
    });

    clearDepth = Settings.cached<number>({
        read: cache => cache.clearDepth,
        write: (cache, value) => {
            cache.clearDepth = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.clearDepth(value);
        },
    });

    lineWidth = Settings.cached<number>({
        read: cache => cache.lineWidth,
        write: (cache, value) => {
            cache.lineWidth = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.lineWidth(value);
        },
    });

    blendEquation = (() => {
        const setting = Settings.cached<[BlendEquation, BlendEquation]>({
            read: cache => cache.blendEquation,
            write: (cached, value) => {
                cached.blendEquation = value;
            },
            equals: (v1, v2) => v1.every((x, i) => x === v2[i]),
            apply: (gl, [rgb, alpha]) => {
                gl.handle.blendEquationSeparate(rgb, alpha);
            },
        });

        return function (this: Settings, rgb: BlendEquation, alpha: BlendEquation = rgb) {
            return setting.call(this, [rgb, alpha]);
        };
    })();

    blendFunction = (() => {
        const setting = Settings.cached<[BlendFunction, BlendFunction, BlendFunction, BlendFunction]>({
            read: cache => cache.blendFunction,
            write: (cached, value) => {
                cached.blendFunction = value;
            },
            equals: (v1, v2) => v1.every((x, i) => x === v2[i]),
            apply: (gl, [srcRgb, dstRgb, srcAlpha, dstAlpha]) => {
                gl.handle.blendFuncSeparate(srcRgb, dstRgb, srcAlpha, dstAlpha);
            },
        });

        return function (
            this: Settings,
            srcRgb: BlendFunction,
            dstRgb: BlendFunction,
            srcAlpha: BlendFunction = srcRgb,
            dstAlpha: BlendFunction = dstRgb,
        ) {
            return setting.call(this, [srcRgb, dstRgb, srcAlpha, dstAlpha]);
        };
    })();

    depthFunction = Settings.cached<DepthFunction>({
        read: cache => cache.depthFunction,
        write: (cache, value) => {
            cache.depthFunction = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.depthFunc(value);
        },
    });

    clearColor = (() => {
        const setting = Settings.cached<[number, number, number, number]>({
            read: cache => cache.clearColor,
            write: (cached, value) => {
                cached.clearColor = value;
            },
            equals: (v1, v2) => v1.every((x, i) => x === v2[i]),
            apply: (gl, [r, g, b, a]) => {
                gl.handle.clearColor(r, g, b, a);
            },
        });

        return function (this: Settings, r: number, g: number, b: number, a: number) {
            return setting.call(this, [r, g, b, a]);
        };
    })();

    activeTexture = Settings.cached<number>({
        read: cache => cache.activeTexture,
        write: (cache, value) => {
            cache.activeTexture = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.activeTexture(GlEnum.TEXTURE0 + value);
        },
    });

    texture = (() => {
        const textures = new Array(16).fill(null).map((_, i) => {
            return Settings.cached<Texture | null>({
                read: cache => cache.textures.get(i) || null,
                write: (cache, texture) => {
                    if (texture) {
                        cache.textures.set(i, texture);
                    } else {
                        cache.textures.delete(i);
                    }
                },
                equals: (v1, v2) => v1 === v2,
                apply: (gl, value) => {
                    gl.settings().activeTexture(i).apply(() => {
                        gl.handle.bindTexture(GlEnum.TEXTURE_2D, value?.handle || null);
                    });
                }
            });
        });

        return function(this: Settings, i: number, texture: Texture | null) {
            return textures[i].call(this, texture);
        };
    })();

    textures(textures: (Texture | null)[]) {
        let result: Settings = this;
        for (let i = 0; i < 16; i++) {
            result = result.texture(i, i >= textures.length ? null : textures[i]);
        }
        return result;
    }

    arrayBuffer = Settings.cached<ArrayBuffer | null>({
        read: cache => cache.arrayBuffer,
        write: (cache, value) => {
            cache.arrayBuffer = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.bindBuffer(GlEnum.ARRAY_BUFFER, value?.handle ?? null);
        },
    });

    elementsBuffer = Settings.cached<ElementsBuffer | null>({
        read: cache => cache.elementsBuffer,
        write: (cache, value) => {
            cache.elementsBuffer = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.bindBuffer(GlEnum.ELEMENT_ARRAY_BUFFER, value?.handle ?? null);
        },
    });

    program = Settings.cached<Program | null>({
        read: cache => cache.program,
        write: (cache, value) => {
            cache.program = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.useProgram(value ? value.handle : null);
        },
    });

    renderBuffer = Settings.cached<RenderBuffer | null>({
        read: cache => cache.renderBuffer,
        write: (cache, value) => {
            cache.renderBuffer = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.bindRenderbuffer(GlEnum.RENDERBUFFER, value ? value.handle : null);
        },
    });

    frameBuffer = Settings.cached<FrameBuffer | null>({
        read: cache => cache.frameBuffer,
        write: (cache, value) => {
            cache.frameBuffer = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.bindFramebuffer(GlEnum.FRAMEBUFFER, value ? value.handle : null);
        },
    });

    enabledAttributes(locations: number[]) {
        return this.then(new Settings(this.gl, this.cache, (callback) => {
            const handle = this.gl.handle;
            const oldValue = this.cache.enabledAttributes;
            const newValue = new Set(locations);
            this.cache.enabledAttributes = newValue;

            const applyDiff = (source: Set<number>, target: Set<number>) => {
                source.forEach(i => {
                    if (!target.has(i)) {
                        handle.disableVertexAttribArray(i);
                    }
                });
                target.forEach(i => {
                    if (!source.has(i)) {
                        handle.enableVertexAttribArray(i);
                    }
                });
            };

            try {
                applyDiff(oldValue, newValue);
                return callback();
            } finally {
                applyDiff(newValue, oldValue);
                this.cache.enabledAttributes = oldValue;
            }
        }));
    }

    instancedAttributes(locations: number[]) {
        return this.then(new Settings(this.gl, this.cache, (callback) => {
            const handle = this.gl.instancedArrays;
            const oldValue = this.cache.instancedAttributes;
            const newValue = new Set(locations);
            this.cache.instancedAttributes = newValue;

            const applyDiff = (source: Set<number>, target: Set<number>) => {
                source.forEach(i => {
                    if (!target.has(i)) {
                        handle.vertexAttribDivisorANGLE(i, 0);
                    }
                });
                target.forEach(i => {
                    if (!source.has(i)) {
                        handle.vertexAttribDivisorANGLE(i, 1);
                    }
                });
            };

            try {
                applyDiff(oldValue, newValue);
                return callback();
            } finally {
                applyDiff(newValue, oldValue);
                this.cache.instancedAttributes = oldValue;
            }
        }));
    }

    renderTarget(texture: Texture) {
        return new Settings(this.gl, this.cache, (callback) => {
            return use(new FrameBuffer(this.gl, texture), frameBuffer => {
                return this.gl.settings()
                    .frameBuffer(frameBuffer)
                    .viewport(0, 0, texture.width, texture.height)
                    .apply(callback);
            });
        });
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
} & ({
    image: TexImageSource;
} | {
    data: ArrayBufferView;
    width: number;
    height: number;
} | {
    width: number;
    height: number;
});

export class Texture {
    readonly handle: WebGLTexture;
    readonly width: number;
    readonly height: number;
    readonly format: TextureFormat;
    readonly filter: TextureFilter;

    constructor(public readonly gl: Gl, config: TextureConfig) {
        this.handle = gl.handle.createTexture()!;

        this.format = config.format || TextureFormat.Rgba;
        this.filter = config.filter || TextureFilter.Nearest;

        if ("image" in config) {
            this.width = config.image instanceof HTMLImageElement
                ? config.image.naturalWidth
                : config.image.width;
            this.height = config.image instanceof HTMLImageElement
                ? config.image.naturalHeight
                : config.image.height;
        } else {
            this.width = config.width;
            this.height = config.height;
        }

        gl.settings().activeTexture(0).texture(0, this).apply(() => {
            gl.handle.pixelStorei(GlEnum.UNPACK_FLIP_Y_WEBGL, 1);
            gl.handle.texParameteri(GlEnum.TEXTURE_2D, GlEnum.TEXTURE_MAG_FILTER, this.filter);
            gl.handle.texParameteri(GlEnum.TEXTURE_2D, GlEnum.TEXTURE_MIN_FILTER, this.filter);
            gl.handle.texParameteri(GlEnum.TEXTURE_2D, GlEnum.TEXTURE_WRAP_S, GlEnum.CLAMP_TO_EDGE);
            gl.handle.texParameteri(GlEnum.TEXTURE_2D, GlEnum.TEXTURE_WRAP_T, GlEnum.CLAMP_TO_EDGE);

            if ("image" in config) {
                gl.handle.texImage2D(
                    GlEnum.TEXTURE_2D,
                    0,
                    this.format,
                    this.format,
                    GlEnum.UNSIGNED_BYTE,
                    config.image,
                );
            } else {
                gl.handle.texImage2D(
                    GlEnum.TEXTURE_2D,
                    0,
                    this.format,
                    this.width,
                    this.height,
                    0, // border
                    this.format,
                    GlEnum.UNSIGNED_BYTE,
                    "data" in config ? config.data : null,
                );
            }
        });
    }

    dispose() {
        this.gl.handle.deleteTexture(this.handle);
    }
}


export class FrameBuffer implements Disposable {

    readonly handle: WebGLFramebuffer;

    constructor(
        public readonly gl: Gl,
        public readonly colorBuffer: Texture,
        public readonly depthBuffer?: RenderBuffer,
    ) {
        this.handle = gl.handle.createFramebuffer()!;
        gl.settings().frameBuffer(this).apply(() => {
            gl.handle.framebufferTexture2D(
                GlEnum.FRAMEBUFFER,
                GlEnum.COLOR_ATTACHMENT0,
                GlEnum.TEXTURE_2D,
                colorBuffer.handle,
                0,
            );
            depthBuffer && gl.handle.framebufferRenderbuffer(
                GlEnum.FRAMEBUFFER,
                GlEnum.DEPTH_ATTACHMENT,
                GlEnum.RENDERBUFFER,
                depthBuffer.handle
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
        gl.settings().renderBuffer(this).apply(() => {
            gl.handle.renderbufferStorage(
                GlEnum.RENDERBUFFER,
                GlEnum.DEPTH_COMPONENT16,
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
            gl.settings().renderBuffer(this).apply(() => {
                gl.handle.renderbufferStorage(
                    GlEnum.RENDERBUFFER,
                    GlEnum.DEPTH_COMPONENT16,
                    width,
                    height,
                );
            });
        }
        return this
    }

    dispose() {
        this.gl.handle.deleteRenderbuffer(this.handle);
    }
}

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
        const content = data instanceof Float32Array ? data : new Float32Array(data);
        this.lengthValue = content.length;

        const gl = this.gl;

        gl.settings().arrayBuffer(this).apply(() => {
            gl.handle.bufferData(
                WebGL2RenderingContext.ARRAY_BUFFER,
                content,
                this.usage,
            );
        });

        return this;
    }

    dispose() {
        this.gl.handle.deleteBuffer(this.handle);
    }
}

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
        const content = (data instanceof Uint8Array || data instanceof Uint16Array) ? data : new Uint16Array(data);
        this.lengthValue = content.length;

        const gl = this.gl;

        gl.settings().elementsBuffer(this).apply(() => {
            gl.handle.bufferData(
                WebGL2RenderingContext.ARRAY_BUFFER,
                content,
                this.usage,
            );
        });

        return this;
    }

    dispose() {
        this.gl.handle.deleteBuffer(this.handle);
    }
}

class Shader implements Disposable {
    readonly handle: WebGLShader;

    constructor(
        public readonly gl: Gl,
        public readonly type: ShaderType,
        public readonly source: string,
    ) {
        const handle = this.handle = gl.handle.createShader(type)!;

        gl.handle.shaderSource(handle, source);
        gl.handle.compileShader(handle);
        if (gl.handle.getShaderParameter(handle, GlEnum.COMPILE_STATUS) === false) {
            throw new Error(`WebGL error '${gl.handle.getShaderInfoLog(handle)}' in '${source}'`);
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
        const handle = this.handle = gl.handle.createProgram()!;
        gl.handle.attachShader(handle, vertex.handle);
        gl.handle.attachShader(handle, fragment.handle);
        gl.handle.linkProgram(handle);
        if (gl.handle.getProgramParameter(handle, GlEnum.LINK_STATUS) === false) {
            throw new Error(gl.handle.getProgramInfoLog(handle) || `Program linking error:\n${vertex.source};\n${fragment.source}`);
        }

        // uniforms
        const uniformsCount: number = gl.handle.getProgramParameter(handle, GlEnum.ACTIVE_UNIFORMS);
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
        const attributesCount = gl.handle.getProgramParameter(handle, GlEnum.ACTIVE_ATTRIBUTES);
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
            gl.settings().program(this).apply(() => {
                switch (type) {
                case GlEnum.BOOL:
                    gl.handle.uniform1i(location, value[0] ? 1 : 0);
                    break;
                case GlEnum.SAMPLER_2D:
                    gl.handle.uniform1iv(location, value);
                    break;
                case GlEnum.FLOAT:
                    gl.handle.uniform1fv(location, value);
                    break;
                case GlEnum.FLOAT_VEC2:
                    gl.handle.uniform2fv(location, value);
                    break;
                case GlEnum.FLOAT_VEC3:
                    gl.handle.uniform3fv(location, value);
                    break;
                case GlEnum.FLOAT_VEC4:
                    gl.handle.uniform4fv(location, value);
                    break;
                case GlEnum.FLOAT_MAT2:
                    gl.handle.uniformMatrix2fv(location, false, value);
                    break;
                case GlEnum.FLOAT_MAT3:
                    gl.handle.uniformMatrix3fv(location, false, value);
                    break;
                case GlEnum.FLOAT_MAT4:
                    gl.handle.uniformMatrix4fv(location, false, value);
                    break;
                }
            });
        }
    }

    setAttribute(name: string, buffer: ArrayBuffer, strideInFloats: number, offsetInFloats: number) {
        const attr = this.attributes[name];
        if (attr != null) {
            const { gl } = this;

            gl.settings().arrayBuffer(buffer).apply(() => {
                gl.handle.vertexAttribPointer(
                    attr.location,
                    (() => {
                        switch (attr.type) {
                        case GlEnum.FLOAT:
                            return 1;
                        case GlEnum.FLOAT_VEC2:
                            return 2;
                        case GlEnum.FLOAT_VEC3:
                            return 3;
                        case GlEnum.FLOAT_VEC4:
                            return 4;
                        case GlEnum.FLOAT_MAT2:
                            return 4;
                        case GlEnum.FLOAT_MAT3:
                            return 9;
                        case GlEnum.FLOAT_MAT4:
                            return 16;
                        default:
                            throw new Error(`Invalid attribute type '${attr.type}'`);
                        }
                    })(),
                    GlEnum.FLOAT,
                    false,
                    strideInFloats * 4,
                    offsetInFloats * 4
                );
            });
        } else {
            console.warn(`Attribute '${name}' not found`)
        }
    }

    dispose() {
        this.gl.handle.deleteProgram(this.handle);
    }
}
