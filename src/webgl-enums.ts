import {
    FRONT,
    BACK,
    FRONT_AND_BACK,
    FUNC_ADD,
    FUNC_SUBTRACT,
    FUNC_REVERSE_SUBTRACT,
    NEVER,
    LESS,
    EQUAL,
    LEQUAL,
    GREATER,
    NOTEQUAL,
    GEQUAL,
    ALWAYS,
    ZERO,
    ONE,
    SRC_COLOR,
    ONE_MINUS_SRC_COLOR,
    DST_COLOR,
    ONE_MINUS_DST_COLOR,
    SRC_ALPHA,
    ONE_MINUS_SRC_ALPHA,
    DST_ALPHA,
    ONE_MINUS_DST_ALPHA,
    SRC_ALPHA_SATURATE,
    NEAREST,
    LINEAR,
    ALPHA,
    LUMINANCE,
    LUMINANCE_ALPHA,
    RGB,
    RGBA,
    SRGB_EXT,
    SRGB8_ALPHA8_EXT,
    VERTEX_SHADER,
    FRAGMENT_SHADER,
    NO_ERROR,
    INVALID_ENUM,
    INVALID_VALUE,
    INVALID_OPERATION,
    OUT_OF_MEMORY,
    STREAM_DRAW,
    STATIC_DRAW,
    DYNAMIC_DRAW,
    ARRAY_BUFFER,
    ELEMENT_ARRAY_BUFFER,
    POINTS,
    LINES,
    LINE_STRIP,
    LINE_LOOP,
    TRIANGLES,
    TRIANGLE_STRIP,
    TRIANGLE_FAN,
} from "./webgl-consts";

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
