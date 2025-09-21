import { command } from "./command";
import { ProgramSource, SourceConfig, TypeMap } from "./dsl";
import { Disposable, uses } from "./disposable";
import { Settings, SettingsCache } from "./settings";
import {
    ALIASED_POINT_SIZE_RANGE,
    COLOR_BUFFER_BIT,
    DEPTH_BUFFER_BIT,
    UNSIGNED_BYTE,
    UNSIGNED_SHORT,
} from "./consts";
import {
    BufferUsage,
    ErrorCode,
    PixelFormat,
    PrimitivesType,
    ShaderType,
} from "./enums";
import { Program, Shader } from "./program";
import { ElementsBuffer } from "./elements-buffer";
import { ArrayBuffer } from "./array-buffer";
import { RenderBuffer } from "./render-buffer";
import { FrameBuffer } from "./frame-buffer";
import { Texture, TextureConfig } from "./texture";
import WithoutPrecision = TypeMap.WithoutPrecision;

/**
 * The main class of this library. It provides access to WebGL context.
 * Use it to create programs, textures, buffers, and change WebGL state.
 */
export class Gl implements Disposable {
    readonly handle: WebGLRenderingContext;
    readonly instancedArraysExtension: ANGLE_instanced_arrays;
    private readonly srgbExtension: EXT_sRGB | null;
    private readonly minMaxExtension: EXT_blend_minmax | null;

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

        this.minMaxExtension = this.handle.getExtension("EXT_blend_minmax");

        this.srgbExtension = this.handle.getExtension("EXT_sRGB");
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
