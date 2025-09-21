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
} from "./consts";
import {
    BlendEquation,
    BlendFunction,
    DataType,
    DepthFunction,
    FaceCulling,
} from "./enums";

export interface Attribute {
    buffer: ArrayBuffer;
    location: number;
    type: DataType;
    stride: number;
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
    enabledAttributes: Set<number>;
    instancedAttributes: Set<number>;
    renderBuffer: RenderBuffer | null;
    frameBuffer: FrameBuffer | null;
    cullFace: boolean;
    cullFaceMode: FaceCulling;
}

export namespace SettingsCache {
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

/**
 * Settings builder. To create an instance of this class, use the `settings()` method of the `Gl` class.
 */
import { use } from "./disposable";
import { Program } from "./program";
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
                const handle = this.gl.instancedArraysExtension;
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
            return use(this.gl.frameBuffer(texture), frameBuffer => {
                return this.gl
                    .settings()
                    .frameBuffer(frameBuffer)
                    .viewport(0, 0, texture.width, texture.height)
                    .apply(callback);
            });
        });
    }
}
