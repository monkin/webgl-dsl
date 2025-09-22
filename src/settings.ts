import type { Gl } from "./gl";
import {
    BLEND,
    CULL_FACE,
    DEPTH_TEST,
    SCISSOR_TEST,
    TEXTURE0,
    TEXTURE_2D,
    ARRAY_BUFFER,
    ELEMENT_ARRAY_BUFFER,
    FRAMEBUFFER,
    RENDERBUFFER,
    FLOAT,
} from "./consts";
import {
    BlendEquation,
    BlendFunction,
    AttributeDataType,
    DepthFunction,
    FaceCulling,
} from "./enums";

export interface AttributePointer {
    buffer: ArrayBuffer;
    type: AttributeDataType;
    /**
     * Stride in bytes.
     */
    stride: number;
    /**
     * Offset in bytes.
     */
    offset: number;
    divisor: number;
}

export interface SettingsCache {
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
    attributes: Map<AttributeLocation, AttributePointer>;
    renderBuffer: RenderBuffer | null;
    frameBuffer: FrameBuffer | null;
    cullFace: boolean;
    cullFaceMode: FaceCulling;
}

export namespace SettingsCache {
    export function initial(): SettingsCache {
        return {
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
            attributes: new Map(),
            renderBuffer: null,
            frameBuffer: null,
            cullFace: false,
            cullFaceMode: FaceCulling.Back,
        };
    }
}

/**
 * Settings builder. To create an instance of this class, use the `settings()` method of the `Gl` class.
 */
import { use } from "./disposable";
import { AttributeLocation, Program } from "./program";
import { ElementsBuffer } from "./elements-buffer";
import { ArrayBuffer } from "./array-buffer";
import { RenderBuffer } from "./render-buffer";
import { FrameBuffer } from "./frame-buffer";
import { Texture } from "./texture";

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
        write: (cache: SettingsCache, value: T) => void;
        equals: (v1: T, v2: T) => boolean;
        apply: (gl: Gl, value: T) => void;
    }) {
        return function (settings: Settings, value: T) {
            const { gl, cache } = settings;
            return settings.then(
                new Settings(gl, cache, <R>(callback: () => R): R => {
                    const cached = read(cache);
                    if (equals(cached, value)) {
                        return callback();
                    } else {
                        try {
                            write(cache, value);
                            apply(gl, value);
                            return callback();
                        } finally {
                            write(cache, cached);
                            apply(gl, cached);
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

    private static blend = Settings.cached<boolean>({
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
    blend(value: boolean) {
        return Settings.blend(this, value);
    }

    private static cullFace = Settings.cached<boolean>({
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
    cullFace(value: boolean) {
        return Settings.cullFace(this, value);
    }

    private static cullFaceMode = Settings.cached<FaceCulling>({
        read: cache => cache.cullFaceMode,
        write: (cache, value) => {
            cache.cullFaceMode = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.cullFace(value);
        },
    });
    cullFaceMode(value: FaceCulling) {
        return Settings.cullFaceMode(this, value);
    }

    private static viewport = (() => {
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
            settings: Settings,
            x: number,
            y: number,
            width: number,
            height: number,
        ) {
            return setting(settings, [x, y, width, height]);
        };
    })();
    viewport(x: number, y: number, width: number, height: number) {
        return Settings.viewport(this, x, y, width, height);
    }

    private static scissorTest = Settings.cached<boolean>({
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
    scissorTest(value: boolean) {
        return Settings.scissorTest(this, value);
    }

    private static scissorBox = (() => {
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
            settings: Settings,
            x: number,
            y: number,
            width: number,
            height: number,
        ) {
            return setting(settings, [x, y, width, height]);
        };
    })();
    scissorBox(x: number, y: number, width: number, height: number) {
        return Settings.scissorBox(this, x, y, width, height);
    }

    private static depthTest = Settings.cached<boolean>({
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
    depthTest(value: boolean) {
        return Settings.depthTest(this, value);
    }

    private static clearDepth = Settings.cached<number>({
        read: cache => cache.clearDepth,
        write: (cache, value) => {
            cache.clearDepth = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.clearDepth(value);
        },
    });
    clearDepth(value: number) {
        return Settings.clearDepth(this, value);
    }

    private static lineWidth = Settings.cached<number>({
        read: cache => cache.lineWidth,
        write: (cache, value) => {
            cache.lineWidth = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.lineWidth(value);
        },
    });
    lineWidth(value: number) {
        return Settings.lineWidth(this, value);
    }

    private static blendEquation = (() => {
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
            settings: Settings,
            rgb: BlendEquation,
            alpha: BlendEquation = rgb,
        ) {
            return setting(settings, [rgb, alpha]);
        };
    })();
    blendEquation(rgb: BlendEquation, alpha?: BlendEquation) {
        return Settings.blendEquation(this, rgb, alpha);
    }

    private static blendFunction = (() => {
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
            settings: Settings,
            srcRgb: BlendFunction,
            dstRgb: BlendFunction,
            srcAlpha: BlendFunction = srcRgb,
            dstAlpha: BlendFunction = dstRgb,
        ) {
            return setting(settings, [srcRgb, dstRgb, srcAlpha, dstAlpha]);
        };
    })();
    blendFunction(
        srcRgb: BlendFunction,
        dstRgb: BlendFunction,
        srcAlpha?: BlendFunction,
        dstAlpha?: BlendFunction,
    ) {
        return Settings.blendFunction(this, srcRgb, dstRgb, srcAlpha, dstAlpha);
    }

    private static depthFunction = Settings.cached<DepthFunction>({
        read: cache => cache.depthFunction,
        write: (cache, value) => {
            cache.depthFunction = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.depthFunc(value);
        },
    });
    depthFunction(value: DepthFunction) {
        return Settings.depthFunction(this, value);
    }

    private static clearColor = (() => {
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
            settings: Settings,
            r: number,
            g: number,
            b: number,
            a: number,
        ) {
            return setting(settings, [r, g, b, a]);
        };
    })();
    clearColor(r: number, g: number, b: number, a: number) {
        return Settings.clearColor(this, r, g, b, a);
    }

    private static activeTexture = Settings.cached<number>({
        read: cache => cache.activeTexture,
        write: (cache, value) => {
            cache.activeTexture = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.activeTexture(TEXTURE0 + value);
        },
    });
    activeTexture(value: number) {
        return Settings.activeTexture(this, value);
    }

    private static texture = (() => {
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

        return function (
            settings: Settings,
            i: number,
            texture: Texture | null,
        ) {
            return textures[i](settings, texture);
        };
    })();
    texture(i: number, texture: Texture | null) {
        return Settings.texture(this, i, texture);
    }

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

    private static arrayBuffer = Settings.cached<ArrayBuffer | null>({
        read: cache => cache.arrayBuffer,
        write: (cache, value) => {
            cache.arrayBuffer = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.bindBuffer(ARRAY_BUFFER, value?.handle ?? null);
        },
    });
    arrayBuffer(value: ArrayBuffer | null) {
        return Settings.arrayBuffer(this, value);
    }

    private static elementsBuffer = Settings.cached<ElementsBuffer | null>({
        read: cache => cache.elementsBuffer,
        write: (cache, value) => {
            cache.elementsBuffer = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.bindBuffer(ELEMENT_ARRAY_BUFFER, value?.handle ?? null);
        },
    });
    elementsBuffer(value: ElementsBuffer | null) {
        return Settings.elementsBuffer(this, value);
    }

    private static program = Settings.cached<Program | null>({
        read: cache => cache.program,
        write: (cache, value) => {
            cache.program = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.useProgram(value ? value.handle : null);
        },
    });
    program(value: Program | null) {
        return Settings.program(this, value);
    }

    private static renderBuffer = Settings.cached<RenderBuffer | null>({
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
    renderBuffer(value: RenderBuffer | null) {
        return Settings.renderBuffer(this, value);
    }

    private static frameBuffer = Settings.cached<FrameBuffer | null>({
        read: cache => cache.frameBuffer,
        write: (cache, value) => {
            cache.frameBuffer = value;
        },
        equals: (v1, v2) => v1 === v2,
        apply: (gl, value) => {
            gl.handle.bindFramebuffer(FRAMEBUFFER, value ? value.handle : null);
        },
    });
    frameBuffer(value: FrameBuffer | null) {
        return Settings.frameBuffer(this, value);
    }

    renderTarget(texture: Texture) {
        return new Settings(this.gl, this.cache, callback => {
            return use(this.gl.frameBuffer(texture), frameBuffer => {
                return this.gl
                    .settings()
                    .frameBuffer(frameBuffer)
                    .viewport(0, 0, texture.width, texture.height)
                    .apply(callback);
            });
        });
    }

    private writeAttributePointer(
        location: AttributeLocation,
        pointer: AttributePointer | null,
    ) {
        const { gl } = this;
        const { handle, instancedArraysExtension } = gl;

        if (!pointer) {
            handle.disableVertexAttribArray(location);
            this.cache.attributes.delete(location);
        } else {
            handle.enableVertexAttribArray(location);
            gl.settings()
                .arrayBuffer(pointer.buffer)
                .apply(() => {
                    handle.vertexAttribPointer(
                        location,
                        AttributeDataType.getSizeInFloats(pointer.type),
                        FLOAT,
                        false,
                        pointer.stride,
                        pointer.offset,
                    );
                });
            instancedArraysExtension.vertexAttribDivisorANGLE(
                location,
                pointer.divisor,
            );
            this.cache.attributes.set(location, pointer);
        }
    }

    attribute(location: AttributeLocation, pointer: AttributePointer | null) {
        const gl = this.gl;
        const handle = gl.handle;
        return this.then(
            new Settings(gl, this.cache, callback => {
                const { attributes } = this.cache;

                const old = attributes.get(location) ?? null;
                if (!pointer && !old) return callback();

                if (
                    pointer &&
                    old &&
                    pointer.buffer === old.buffer &&
                    pointer.offset === old.offset &&
                    pointer.stride === old.stride &&
                    pointer.type === old.type &&
                    pointer.divisor === old.divisor
                ) {
                    return callback();
                }

                try {
                    this.writeAttributePointer(location, pointer);
                    return callback();
                } finally {
                    this.writeAttributePointer(location, old);
                }
            }),
        );
    }

    attributes(attributes: Map<AttributeLocation, AttributePointer>) {
        const old = new Set(this.cache.attributes.keys());
        return Array.from(attributes.entries())
            .reduce((settings: Settings, [location, pointer]) => {
                return settings.attribute(location, pointer);
            }, this)
            .then(
                Array.from(old).reduce(
                    (settings, location) => {
                        if (attributes.has(location)) {
                            return settings;
                        } else {
                            return settings.attribute(location, null);
                        }
                    },
                    new Settings(this.gl, this.cache),
                ),
            );
    }
}
