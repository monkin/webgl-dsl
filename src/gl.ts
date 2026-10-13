import { command } from "./command";
import { ProgramSource, SourceConfig, TypeMap } from "./dsl";
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
 *
 * It follows its context's loss and restore. The loss is always
 * `preventDefault`ed — without that the browser never restores a context —
 * and both ends are reported through {@link Gl.onContextLost} and
 * {@link Gl.onContextRestored}. A restore leaves every resource made before
 * it dead: disposing one makes no GL call, and building anew is the caller's.
 */
export class Gl implements Disposable {
    readonly handle: WebGLRenderingContext;
    private instancedArraysExtensionValue!: ANGLE_instanced_arrays;
    private srgbExtension: EXT_sRGB | null = null;
    private minMaxExtension: EXT_blend_minmax | null = null;

    private readonly settingsCache = SettingsCache.initial();

    private generationValue = 0;
    private readonly lostListeners = new Set<() => void>();
    private readonly restoredListeners = new Set<() => void>();
    /**
     * The canvas the loss events come from; `null` for a context with no
     * canvas to listen on (headless-gl), which is never lost.
     */
    private readonly canvasEvents: EventTarget | null;

    private readonly handleContextLost = (event: Event) => {
        event.preventDefault();
        for (const listener of [...this.lostListeners]) listener();
    };

    private readonly handleContextRestored = () => {
        this.generationValue++;
        // Extensions enabled before a loss are not restored with the context.
        this.fetchExtensions();
        for (const listener of [...this.restoredListeners]) listener();
    };

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
            const context = a1.getContext("webgl", a2);
            if (context === null) {
                throw new Error("WebGL is unavailable");
            }
            this.handle = context;
        } else {
            this.handle = a1 as WebGLRenderingContext;
        }

        this.fetchExtensions();

        const canvas: unknown = this.handle.canvas;
        this.canvasEvents =
            typeof (canvas as EventTarget | undefined)?.addEventListener ===
            "function"
                ? (canvas as EventTarget)
                : null;
        this.canvasEvents?.addEventListener(
            "webglcontextlost",
            this.handleContextLost,
        );
        this.canvasEvents?.addEventListener(
            "webglcontextrestored",
            this.handleContextRestored,
        );
    }

    private fetchExtensions() {
        this.instancedArraysExtensionValue = this.handle.getExtension(
            "ANGLE_instanced_arrays",
        )!;
        this.minMaxExtension = this.handle.getExtension("EXT_blend_minmax");
        this.srgbExtension = this.handle.getExtension("EXT_sRGB");
    }

    get instancedArraysExtension(): ANGLE_instanced_arrays {
        return this.instancedArraysExtensionValue;
    }

    /**
     * Counts the context's restores. A resource remembers the generation it
     * was made in; once the count moves on, its handle belongs to a context
     * that is gone.
     */
    get generation(): number {
        return this.generationValue;
    }

    /**
     * Whether a resource made in `generation` is dead: the context is lost
     * now, or was restored since.
     */
    isDead(generation: number): boolean {
        return (
            this.handle.isContextLost() || generation !== this.generationValue
        );
    }

    /**
     * Calls `listener` whenever the context is lost. Every GL call is a
     * no-op until the restore.
     */
    onContextLost(listener: () => void): Disposable {
        this.lostListeners.add(listener);
        return {
            [Symbol.dispose]: () => {
                this.lostListeners.delete(listener);
            },
        };
    }

    /**
     * Calls `listener` whenever the context is restored. Everything made
     * before is dead: build commands, textures and buffers again, then
     * redraw.
     */
    onContextRestored(listener: () => void): Disposable {
        this.restoredListeners.add(listener);
        return {
            [Symbol.dispose]: () => {
                this.restoredListeners.delete(listener);
            },
        };
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
        using vertexShader = new Shader(this, ShaderType.Vertex, vertex);
        using fragmentShader = new Shader(this, ShaderType.Fragment, fragment);
        return new Program(this, vertexShader, fragmentShader);
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
     * Stop following the context's loss, then destroy the context
     */
    [Symbol.dispose]() {
        this.canvasEvents?.removeEventListener(
            "webglcontextlost",
            this.handleContextLost,
        );
        this.canvasEvents?.removeEventListener(
            "webglcontextrestored",
            this.handleContextRestored,
        );
        this.lostListeners.clear();
        this.restoredListeners.clear();
        const ex = this.handle.getExtension("WEBGL_lose_context");
        if (ex) {
            ex.loseContext();
        }
    }
}
