import { command } from "./command";
import { ProgramSource, SourceConfig, TypeMap } from "./dsl";
import { Disposable, use, uses } from "./disposable";
import WithoutPrecision = TypeMap.WithoutPrecision;

/**
 * Not every server WebGL implementation has it's own WebGLRenderingContext class
 */

/* ClearBufferMask */
const DEPTH_BUFFER_BIT = 0x00000100;
const STENCIL_BUFFER_BIT = 0x00000400;
const COLOR_BUFFER_BIT = 0x00004000;

/* BeginMode */
const POINTS = 0x0000;
const LINES = 0x0001;
const LINE_LOOP = 0x0002;
const LINE_STRIP = 0x0003;
const TRIANGLES = 0x0004;
const TRIANGLE_STRIP = 0x0005;
const TRIANGLE_FAN = 0x0006;

/* AlphaFunction (not supported in ES20) */
/* NEVER */
/* LESS */
/* EQUAL */
/* LEQUAL */
/* GREATER */
/* NOTEQUAL */
/* GEQUAL */
/* ALWAYS */

/* BlendingFactorDest */
const ZERO = 0;
const ONE = 1;
const SRC_COLOR = 0x0300;
const ONE_MINUS_SRC_COLOR = 0x0301;
const SRC_ALPHA = 0x0302;
const ONE_MINUS_SRC_ALPHA = 0x0303;
const DST_ALPHA = 0x0304;
const ONE_MINUS_DST_ALPHA = 0x0305;

/* BlendingFactorSrc */
/* ZERO */
/* ONE */
const DST_COLOR = 0x0306;
const ONE_MINUS_DST_COLOR = 0x0307;
const SRC_ALPHA_SATURATE = 0x0308;
/* SRC_ALPHA */
/* ONE_MINUS_SRC_ALPHA */
/* DST_ALPHA */
/* ONE_MINUS_DST_ALPHA */

/* BlendEquationSeparate */
const FUNC_ADD = 0x8006;
const BLEND_EQUATION = 0x8009;
const BLEND_EQUATION_RGB = 0x8009; /* same as BLEND_EQUATION */
const BLEND_EQUATION_ALPHA = 0x883d;

/* BlendSubtract */
const FUNC_SUBTRACT = 0x800a;
const FUNC_REVERSE_SUBTRACT = 0x800b;

/* Separate Blend Functions */
const BLEND_DST_RGB = 0x80c8;
const BLEND_SRC_RGB = 0x80c9;
const BLEND_DST_ALPHA = 0x80ca;
const BLEND_SRC_ALPHA = 0x80cb;
const CONSTANT_COLOR = 0x8001;
const ONE_MINUS_CONSTANT_COLOR = 0x8002;
const CONSTANT_ALPHA = 0x8003;
const ONE_MINUS_CONSTANT_ALPHA = 0x8004;
const BLEND_COLOR = 0x8005;

/* Buffer Objects */
const ARRAY_BUFFER = 0x8892;
const ELEMENT_ARRAY_BUFFER = 0x8893;
const ARRAY_BUFFER_BINDING = 0x8894;
const ELEMENT_ARRAY_BUFFER_BINDING = 0x8895;

const STREAM_DRAW = 0x88e0;
const STATIC_DRAW = 0x88e4;
const DYNAMIC_DRAW = 0x88e8;

const BUFFER_SIZE = 0x8764;
const BUFFER_USAGE = 0x8765;

const CURRENT_VERTEX_ATTRIB = 0x8626;

/* CullFaceMode */
const FRONT = 0x0404;
const BACK = 0x0405;
const FRONT_AND_BACK = 0x0408;

/* DepthFunction */
/* NEVER */
/* LESS */
/* EQUAL */
/* LEQUAL */
/* GREATER */
/* NOTEQUAL */
/* GEQUAL */
/* ALWAYS */

/* EnableCap */
/* TEXTURE_2D */
const CULL_FACE = 0x0b44;
const BLEND = 0x0be2;
const DITHER = 0x0bd0;
const STENCIL_TEST = 0x0b90;
const DEPTH_TEST = 0x0b71;
const SCISSOR_TEST = 0x0c11;
const POLYGON_OFFSET_FILL = 0x8037;
const SAMPLE_ALPHA_TO_COVERAGE = 0x809e;
const SAMPLE_COVERAGE = 0x80a0;

/* ErrorCode */
const NO_ERROR = 0;
const INVALID_ENUM = 0x0500;
const INVALID_VALUE = 0x0501;
const INVALID_OPERATION = 0x0502;
const OUT_OF_MEMORY = 0x0505;

/* FrontFaceDirection */
const CW = 0x0900;
const CCW = 0x0901;

/* GetPName */
const LINE_WIDTH = 0x0b21;
const ALIASED_POINT_SIZE_RANGE = 0x846d;
const ALIASED_LINE_WIDTH_RANGE = 0x846e;
const CULL_FACE_MODE = 0x0b45;
const FRONT_FACE = 0x0b46;
const DEPTH_RANGE = 0x0b70;
const DEPTH_WRITEMASK = 0x0b72;
const DEPTH_CLEAR_VALUE = 0x0b73;
const DEPTH_FUNC = 0x0b74;
const STENCIL_CLEAR_VALUE = 0x0b91;
const STENCIL_FUNC = 0x0b92;
const STENCIL_FAIL = 0x0b94;
const STENCIL_PASS_DEPTH_FAIL = 0x0b95;
const STENCIL_PASS_DEPTH_PASS = 0x0b96;
const STENCIL_REF = 0x0b97;
const STENCIL_VALUE_MASK = 0x0b93;
const STENCIL_WRITEMASK = 0x0b98;
const STENCIL_BACK_FUNC = 0x8800;
const STENCIL_BACK_FAIL = 0x8801;
const STENCIL_BACK_PASS_DEPTH_FAIL = 0x8802;
const STENCIL_BACK_PASS_DEPTH_PASS = 0x8803;
const STENCIL_BACK_REF = 0x8ca3;
const STENCIL_BACK_VALUE_MASK = 0x8ca4;
const STENCIL_BACK_WRITEMASK = 0x8ca5;
const VIEWPORT = 0x0ba2;
const SCISSOR_BOX = 0x0c10;

/* SCISSOR_TEST */
const COLOR_CLEAR_VALUE = 0x0c22;
const COLOR_WRITEMASK = 0x0c23;
const UNPACK_ALIGNMENT = 0x0cf5;
const PACK_ALIGNMENT = 0x0d05;
const MAX_TEXTURE_SIZE = 0x0d33;
const MAX_VIEWPORT_DIMS = 0x0d3a;
const SUBPIXEL_BITS = 0x0d50;
const RED_BITS = 0x0d52;
const GREEN_BITS = 0x0d53;
const BLUE_BITS = 0x0d54;
const ALPHA_BITS = 0x0d55;
const DEPTH_BITS = 0x0d56;
const STENCIL_BITS = 0x0d57;
const POLYGON_OFFSET_UNITS = 0x2a00;
/* POLYGON_OFFSET_FILL */
const POLYGON_OFFSET_FACTOR = 0x8038;
const TEXTURE_BINDING_2D = 0x8069;
const SAMPLE_BUFFERS = 0x80a8;
const SAMPLES = 0x80a9;
const SAMPLE_COVERAGE_VALUE = 0x80aa;
const SAMPLE_COVERAGE_INVERT = 0x80ab;

/* GetTextureParameter */
/* TEXTURE_MAG_FILTER */
/* TEXTURE_MIN_FILTER */
/* TEXTURE_WRAP_S */
/* TEXTURE_WRAP_T */

const COMPRESSED_TEXTURE_FORMATS = 0x86a3;

/* HintMode */
const DONT_CARE = 0x1100;
const FASTEST = 0x1101;
const NICEST = 0x1102;

/* HintTarget */
const GENERATE_MIPMAP_HINT = 0x8192;

/* DataType */
const BYTE = 0x1400;
const UNSIGNED_BYTE = 0x1401;
const SHORT = 0x1402;
const UNSIGNED_SHORT = 0x1403;
const INT = 0x1404;
const UNSIGNED_INT = 0x1405;
const FLOAT = 0x1406;

/* PixelFormat */
const DEPTH_COMPONENT = 0x1902;
const ALPHA = 0x1906;
const RGB = 0x1907;
const RGBA = 0x1908;
const LUMINANCE = 0x1909;
const LUMINANCE_ALPHA = 0x190a;

/* PixelType */
/* UNSIGNED_BYTE */
const UNSIGNED_SHORT_4_4_4_4 = 0x8033;
const UNSIGNED_SHORT_5_5_5_1 = 0x8034;
const UNSIGNED_SHORT_5_6_5 = 0x8363;

/* Shaders */
const FRAGMENT_SHADER = 0x8b30;
const VERTEX_SHADER = 0x8b31;
const MAX_VERTEX_ATTRIBS = 0x8869;
const MAX_VERTEX_UNIFORM_VECTORS = 0x8dfb;
const MAX_VARYING_VECTORS = 0x8dfc;
const MAX_COMBINED_TEXTURE_IMAGE_UNITS = 0x8b4d;
const MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8b4c;
const MAX_TEXTURE_IMAGE_UNITS = 0x8872;
const MAX_FRAGMENT_UNIFORM_VECTORS = 0x8dfd;
const SHADER_TYPE = 0x8b4f;
const DELETE_STATUS = 0x8b80;
const LINK_STATUS = 0x8b82;
const VALIDATE_STATUS = 0x8b83;
const ATTACHED_SHADERS = 0x8b85;
const ACTIVE_UNIFORMS = 0x8b86;
const ACTIVE_ATTRIBUTES = 0x8b89;
const SHADING_LANGUAGE_VERSION = 0x8b8c;
const CURRENT_PROGRAM = 0x8b8d;

/* StencilFunction */
const NEVER = 0x0200;
const LESS = 0x0201;
const EQUAL = 0x0202;
const LEQUAL = 0x0203;
const GREATER = 0x0204;
const NOTEQUAL = 0x0205;
const GEQUAL = 0x0206;
const ALWAYS = 0x0207;

/* StencilOp */
/* ZERO */
const KEEP = 0x1e00;
const REPLACE = 0x1e01;
const INCR = 0x1e02;
const DECR = 0x1e03;
const INVERT = 0x150a;
const INCR_WRAP = 0x8507;
const DECR_WRAP = 0x8508;

/* StringName */
const VENDOR = 0x1f00;
const RENDERER = 0x1f01;
const VERSION = 0x1f02;

/* TextureMagFilter */
const NEAREST = 0x2600;
const LINEAR = 0x2601;

/* TextureMinFilter */
/* NEAREST */
/* LINEAR */
const NEAREST_MIPMAP_NEAREST = 0x2700;
const LINEAR_MIPMAP_NEAREST = 0x2701;
const NEAREST_MIPMAP_LINEAR = 0x2702;
const LINEAR_MIPMAP_LINEAR = 0x2703;

/* TextureParameterName */
const TEXTURE_MAG_FILTER = 0x2800;
const TEXTURE_MIN_FILTER = 0x2801;
const TEXTURE_WRAP_S = 0x2802;
const TEXTURE_WRAP_T = 0x2803;

/* TextureTarget */
const TEXTURE_2D = 0x0de1;
const TEXTURE = 0x1702;

const TEXTURE_CUBE_MAP = 0x8513;
const TEXTURE_BINDING_CUBE_MAP = 0x8514;
const TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
const TEXTURE_CUBE_MAP_NEGATIVE_X = 0x8516;
const TEXTURE_CUBE_MAP_POSITIVE_Y = 0x8517;
const TEXTURE_CUBE_MAP_NEGATIVE_Y = 0x8518;
const TEXTURE_CUBE_MAP_POSITIVE_Z = 0x8519;
const TEXTURE_CUBE_MAP_NEGATIVE_Z = 0x851a;
const MAX_CUBE_MAP_TEXTURE_SIZE = 0x851c;

/* TextureUnit */
const TEXTURE0 = 0x84c0;
const TEXTURE1 = 0x84c1;
const TEXTURE2 = 0x84c2;
const TEXTURE3 = 0x84c3;
const TEXTURE4 = 0x84c4;
const TEXTURE5 = 0x84c5;
const TEXTURE6 = 0x84c6;
const TEXTURE7 = 0x84c7;
const TEXTURE8 = 0x84c8;
const TEXTURE9 = 0x84c9;
const TEXTURE10 = 0x84ca;
const TEXTURE11 = 0x84cb;
const TEXTURE12 = 0x84cc;
const TEXTURE13 = 0x84cd;
const TEXTURE14 = 0x84ce;
const TEXTURE15 = 0x84cf;
const TEXTURE16 = 0x84d0;
const TEXTURE17 = 0x84d1;
const TEXTURE18 = 0x84d2;
const TEXTURE19 = 0x84d3;
const TEXTURE20 = 0x84d4;
const TEXTURE21 = 0x84d5;
const TEXTURE22 = 0x84d6;
const TEXTURE23 = 0x84d7;
const TEXTURE24 = 0x84d8;
const TEXTURE25 = 0x84d9;
const TEXTURE26 = 0x84da;
const TEXTURE27 = 0x84db;
const TEXTURE28 = 0x84dc;
const TEXTURE29 = 0x84dd;
const TEXTURE30 = 0x84de;
const TEXTURE31 = 0x84df;
const ACTIVE_TEXTURE = 0x84e0;

/* TextureWrapMode */
const REPEAT = 0x2901;
const CLAMP_TO_EDGE = 0x812f;
const MIRRORED_REPEAT = 0x8370;

/* Uniform Types */
const FLOAT_VEC2 = 0x8b50;
const FLOAT_VEC3 = 0x8b51;
const FLOAT_VEC4 = 0x8b52;
const INT_VEC2 = 0x8b53;
const INT_VEC3 = 0x8b54;
const INT_VEC4 = 0x8b55;
const BOOL = 0x8b56;
const BOOL_VEC2 = 0x8b57;
const BOOL_VEC3 = 0x8b58;
const BOOL_VEC4 = 0x8b59;
const FLOAT_MAT2 = 0x8b5a;
const FLOAT_MAT3 = 0x8b5b;
const FLOAT_MAT4 = 0x8b5c;
const SAMPLER_2D = 0x8b5e;
const SAMPLER_CUBE = 0x8b60;

/* Vertex Arrays */
const VERTEX_ATTRIB_ARRAY_ENABLED = 0x8622;
const VERTEX_ATTRIB_ARRAY_SIZE = 0x8623;
const VERTEX_ATTRIB_ARRAY_STRIDE = 0x8624;
const VERTEX_ATTRIB_ARRAY_TYPE = 0x8625;
const VERTEX_ATTRIB_ARRAY_NORMALIZED = 0x886a;
const VERTEX_ATTRIB_ARRAY_POINTER = 0x8645;
const VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = 0x889f;

/* Read Format */
const IMPLEMENTATION_COLOR_READ_TYPE = 0x8b9a;
const IMPLEMENTATION_COLOR_READ_FORMAT = 0x8b9b;

/* Shader Source */
const COMPILE_STATUS = 0x8b81;

/* Shader Precision-Specified Types */
const LOW_FLOAT = 0x8df0;
const MEDIUM_FLOAT = 0x8df1;
const HIGH_FLOAT = 0x8df2;
const LOW_INT = 0x8df3;
const MEDIUM_INT = 0x8df4;
const HIGH_INT = 0x8df5;

/* Framebuffer Object. */
const FRAMEBUFFER = 0x8d40;
const RENDERBUFFER = 0x8d41;

const RGBA4 = 0x8056;
const RGB5_A1 = 0x8057;
const RGB565 = 0x8d62;
const DEPTH_COMPONENT16 = 0x81a5;
const STENCIL_INDEX8 = 0x8d48;
const DEPTH_STENCIL = 0x84f9;

const RENDERBUFFER_WIDTH = 0x8d42;
const RENDERBUFFER_HEIGHT = 0x8d43;
const RENDERBUFFER_INTERNAL_FORMAT = 0x8d44;
const RENDERBUFFER_RED_SIZE = 0x8d50;
const RENDERBUFFER_GREEN_SIZE = 0x8d51;
const RENDERBUFFER_BLUE_SIZE = 0x8d52;
const RENDERBUFFER_ALPHA_SIZE = 0x8d53;
const RENDERBUFFER_DEPTH_SIZE = 0x8d54;
const RENDERBUFFER_STENCIL_SIZE = 0x8d55;

const FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE = 0x8cd0;
const FRAMEBUFFER_ATTACHMENT_OBJECT_NAME = 0x8cd1;
const FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL = 0x8cd2;
const FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE = 0x8cd3;

const COLOR_ATTACHMENT0 = 0x8ce0;
const DEPTH_ATTACHMENT = 0x8d00;
const STENCIL_ATTACHMENT = 0x8d20;
const DEPTH_STENCIL_ATTACHMENT = 0x821a;

const NONE = 0;

const FRAMEBUFFER_COMPLETE = 0x8cd5;
const FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 0x8cd6;
const FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 0x8cd7;
const FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 0x8cd9;
const FRAMEBUFFER_UNSUPPORTED = 0x8cdd;

const FRAMEBUFFER_BINDING = 0x8ca6;
const RENDERBUFFER_BINDING = 0x8ca7;
const MAX_RENDERBUFFER_SIZE = 0x84e8;

const INVALID_FRAMEBUFFER_OPERATION = 0x0506;

/* WebGL-specific enums */
const UNPACK_FLIP_Y_WEBGL = 0x9240;
const UNPACK_PREMULTIPLY_ALPHA_WEBGL = 0x9241;
const CONTEXT_LOST_WEBGL = 0x9242;
const UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;
const BROWSER_DEFAULT_WEBGL = 0x9244;

const SRGB_EXT = 0x8c40;
const SRGB_ALPHA_EXT = 0x8c42;
const SRGB8_ALPHA8_EXT = 0x8c43;
const FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT = 0x8210;

export enum FaceCulling {
    Front = FRONT,
    Back = BACK,
    FrontAndBack = FRONT_AND_BACK,
}

export enum BlendEquation {
    Add = FUNC_ADD,
    Sub = FUNC_SUBTRACT,
    RSub = FUNC_REVERSE_SUBTRACT,
    Min = 0x8007,
    Max = 0x8008,
}

export enum DepthFunction {
    Never = NEVER,
    Less = LESS,
    Equal = EQUAL,
    LEqual = LEQUAL,
    Greater = GREATER,
    NotEqual = NOTEQUAL,
    GEqual = GEQUAL,
    Always = ALWAYS,
}

export enum BlendFunction {
    Zero = ZERO,
    One = ONE,
    SrcColor = SRC_COLOR,
    OneMinusSrcColor = ONE_MINUS_SRC_COLOR,
    DstColor = DST_COLOR,
    OneMinusDstColor = ONE_MINUS_DST_COLOR,
    SrcAlpha = SRC_ALPHA,
    OneMinusSrcAlpha = ONE_MINUS_SRC_ALPHA,
    DstAlpha = DST_ALPHA,
    OneMinusDstAlpha = ONE_MINUS_DST_ALPHA,
    SrcAlphaSaturate = SRC_ALPHA_SATURATE,
}

export enum TextureFilter {
    Nearest = NEAREST,
    Linear = LINEAR,
}

export enum TextureFormat {
    Alpha = ALPHA,
    Luminance = LUMINANCE,
    LuminanceAlpha = LUMINANCE_ALPHA,
    Rgb = RGB,
    Rgba = RGBA,
    Srgb = SRGB_EXT,
    Srgba = SRGB8_ALPHA8_EXT,
}

export enum PixelFormat {
    Rgba = RGBA,
    Rgb = RGB,
    Alpha = ALPHA,
}

export namespace PixelFormat {
    export function getChannelsCount(format: PixelFormat) {
        switch (format) {
            case PixelFormat.Rgb:
                return 3;
            case PixelFormat.Rgba:
                return 4;
            case PixelFormat.Alpha:
                return 1;
        }
    }
}

export enum ShaderType {
    Vertex = VERTEX_SHADER,
    Fragment = FRAGMENT_SHADER,
}

export const texturesCount = 16;

export enum ErrorCode {
    NoError = NO_ERROR,
    InvalidEnum = INVALID_ENUM,
    InvalidValue = INVALID_VALUE,
    InvalidOperation = INVALID_OPERATION,
    OutOfMemory = OUT_OF_MEMORY,
}

export enum BufferUsage {
    /**
     * The data store contents will be modified once and used at most a few times.
     */
    Stream = STREAM_DRAW,
    /**
     * The data store contents will be modified once and used many times.
     */
    Static = STATIC_DRAW,
    /**
     * The data store contents will be modified repeatedly and used many times.
     */
    Dynamic = DYNAMIC_DRAW,
}

export enum BufferTarget {
    Array = ARRAY_BUFFER,
    Elements = ELEMENT_ARRAY_BUFFER,
}

export enum PrimitivesType {
    Points = POINTS,
    Lines = LINES,
    LineStrip = LINE_STRIP,
    LineLoop = LINE_LOOP,
    Triangles = TRIANGLES,
    TriangleStrip = TRIANGLE_STRIP,
    TriangleFan = TRIANGLE_FAN,
}

export class Gl implements Disposable {
    readonly handle: WebGLRenderingContext;
    readonly instancedArrays: ANGLE_instanced_arrays;
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

        this.instancedArrays = this.handle.getExtension(
            "ANGLE_instanced_arrays",
        )!;

        this.minMaxExtension = this.handle.getExtension("EXT_blend_minmax")!;

        this.srgbExtension = this.handle.getExtension("EXT_sRGB")!;
    }

    isContextLost() {
        return this.handle.isContextLost();
    }

    getPointSizeRange(): [number, number] {
        return this.handle.getParameter(ALIASED_POINT_SIZE_RANGE);
    }

    cleanColorBuffer(): this {
        this.handle.clear(COLOR_BUFFER_BIT);
        return this;
    }

    cleanDepthBuffer(): this {
        this.handle.clear(DEPTH_BUFFER_BIT);
        return this;
    }

    /**
     * Clear color and depth buffer
     */
    cleanBuffers(): this {
        this.handle.clear(COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT);
        return this;
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
        this.instancedArrays.drawArraysInstancedANGLE(
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
        this.instancedArrays.drawElementsInstancedANGLE(
            primitivesType,
            elementsCount,
            UNSIGNED_SHORT,
            0,
            instancesCount,
        );
        return this;
    }

    /**
     * Create empty settings object
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
        )((vertex, fragment) => {
            return new Program(this, vertex, fragment);
        });
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
    cullFace: boolean;
    cullFaceMode: FaceCulling;
}

namespace SettingsCache {
    export const initial = (): SettingsCache => ({
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
        cullFace: false,
        cullFaceMode: FaceCulling.Back,
    });
}

export class Settings {
    constructor(
        public readonly gl: Gl,
        private readonly cache: SettingsCache,
        public readonly apply: <T>(callback: () => T) => T = callback =>
            callback(),
    ) {}

    private static cached<T>({
        read,
        write,
        equals,
        apply,
    }: {
        read: (cache: SettingsCache) => T;
        write: (cahe: SettingsCache, value: T) => void;
        equals: (v1: T, v2: T) => boolean;
        apply: (gl: Gl, value: T) => void;
    }) {
        return function (this: Settings, value: T) {
            return this.then(
                new Settings(this.gl, this.cache, <R>(callback: () => R): R => {
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
                }),
            );
        };
    }

    then(settings: Settings) {
        return new Settings(this.gl, this.cache, callback => {
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
                gl.handle.enable(BLEND);
            } else {
                gl.handle.disable(BLEND);
            }
        },
    });

    cullFace = Settings.cached<boolean>({
        read: cache => cache.cullFace,
        write: (cache, value) => {
            cache.cullFace = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            if (value) {
                gl.handle.enable(CULL_FACE);
            } else {
                gl.handle.disable(CULL_FACE);
            }
        },
    });

    cullFaceMode = Settings.cached<FaceCulling>({
        read: cache => cache.cullFaceMode,
        write: (cache, value) => {
            cache.cullFaceMode = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.cullFace(value);
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

        return function (
            this: Settings,
            x: number,
            y: number,
            width: number,
            height: number,
        ) {
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
                gl.handle.enable(SCISSOR_TEST);
            } else {
                gl.handle.disable(SCISSOR_TEST);
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

        return function (
            this: Settings,
            x: number,
            y: number,
            width: number,
            height: number,
        ) {
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
                gl.handle.enable(DEPTH_TEST);
            } else {
                gl.handle.disable(DEPTH_TEST);
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

        return function (
            this: Settings,
            rgb: BlendEquation,
            alpha: BlendEquation = rgb,
        ) {
            return setting.call(this, [rgb, alpha]);
        };
    })();

    blendFunction = (() => {
        const setting = Settings.cached<
            [BlendFunction, BlendFunction, BlendFunction, BlendFunction]
        >({
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

        return function (
            this: Settings,
            r: number,
            g: number,
            b: number,
            a: number,
        ) {
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
            gl.handle.activeTexture(TEXTURE0 + value);
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
                    gl.settings()
                        .activeTexture(i)
                        .apply(() => {
                            gl.handle.bindTexture(
                                TEXTURE_2D,
                                value?.handle || null,
                            );
                        });
                },
            });
        });

        return function (this: Settings, i: number, texture: Texture | null) {
            return textures[i].call(this, texture);
        };
    })();

    textures(textures: (Texture | null)[]) {
        let result: Settings = this;
        for (let i = 0; i < 16; i++) {
            result = result.texture(
                i,
                i >= textures.length ? null : textures[i],
            );
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
            gl.handle.bindBuffer(ARRAY_BUFFER, value?.handle ?? null);
        },
    });

    elementsBuffer = Settings.cached<ElementsBuffer | null>({
        read: cache => cache.elementsBuffer,
        write: (cache, value) => {
            cache.elementsBuffer = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.bindBuffer(ELEMENT_ARRAY_BUFFER, value?.handle ?? null);
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
            gl.handle.bindRenderbuffer(
                RENDERBUFFER,
                value ? value.handle : null,
            );
        },
    });

    frameBuffer = Settings.cached<FrameBuffer | null>({
        read: cache => cache.frameBuffer,
        write: (cache, value) => {
            cache.frameBuffer = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.bindFramebuffer(FRAMEBUFFER, value ? value.handle : null);
        },
    });

    enabledAttributes(locations: number[]) {
        return this.then(
            new Settings(this.gl, this.cache, callback => {
                const handle = this.gl.handle;
                const oldValue = this.cache.enabledAttributes;
                const newValue = new Set(locations);
                this.cache.enabledAttributes = newValue;

                const applyDiff = (
                    source: Set<number>,
                    target: Set<number>,
                ) => {
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
            }),
        );
    }

    instancedAttributes(locations: number[]) {
        return this.then(
            new Settings(this.gl, this.cache, callback => {
                const handle = this.gl.instancedArrays;
                const oldValue = this.cache.instancedAttributes;
                const newValue = new Set(locations);
                this.cache.instancedAttributes = newValue;

                const applyDiff = (
                    source: Set<number>,
                    target: Set<number>,
                ) => {
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
            }),
        );
    }

    renderTarget(texture: Texture) {
        return new Settings(this.gl, this.cache, callback => {
            return use(new FrameBuffer(this.gl, texture), frameBuffer => {
                return this.gl
                    .settings()
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
