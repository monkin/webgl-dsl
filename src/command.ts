import { TypeMap, SourceConfig, source, ProgramSource, Type } from "./dsl";
import {
    Gl,
    Program,
    ElementsBuffer,
    ArrayBuffer,
    PrimitivesType,
    Texture,
} from "./webgl";
import { Disposable } from "./disposable";

export class Command<
    Uniforms extends TypeMap,
    Attributes extends TypeMap,
    Instances extends TypeMap,
> implements Disposable
{
    private readonly program: Program;
    private readonly attributes: ArrayBuffer;
    private readonly instances: ArrayBuffer;
    private readonly elements: ElementsBuffer;

    private readonly attributesStride: number;
    private readonly attributesLayout: TypeMap.LayoutItem[];
    private readonly instancesStride: number;
    private readonly instancesLayout: TypeMap.LayoutItem[];

    private textureInstances = new Map<number, Texture>();
    private textureIndexes = new Map<string, number>();

    constructor(
        public readonly gl: Gl,
        public readonly primitivesType: PrimitivesType,
        public readonly source: ProgramSource<Uniforms, Attributes, Instances>,
    ) {
        this.program = gl.program(source.vertex, source.fragment);

        this.attributes = gl.arrayBuffer();
        this.instances = gl.arrayBuffer();
        this.elements = gl.elementsBuffer();

        this.attributesStride = TypeMap.stride(source.attributes);
        this.attributesLayout = TypeMap.layout(source.attributes);
        this.instancesStride = TypeMap.stride(source.instances);
        this.instancesLayout = TypeMap.layout(source.instances);

        this.attributesLayout.forEach(a => {
            this.program.setAttribute(
                a.name,
                this.attributes,
                a.stride,
                a.offset,
            );
        });

        this.instancesLayout.forEach(a => {
            this.program.setAttribute(
                a.name,
                this.instances,
                a.stride,
                a.offset,
            );
        });

        for (const name in source.uniforms) {
            if (TypeMap.getType(source.uniforms[name]) === Type.Sampler) {
                this.textureIndexes.set(name, this.textureIndexes.size);
            }
        }
    }

    private prepareData<M extends TypeMap>(
        stride: number,
        layout: TypeMap.LayoutItem[],
        items: TypeMap.JsTypeMap<M>[],
    ) {
        const data = new Float32Array(stride * items.length);
        items.forEach((item, i) => {
            layout.forEach(layout => {
                const value = item[layout.name];
                const offset = stride * i + layout.offset;
                if (Array.isArray(value)) {
                    for (let j = 0; j < value.length; j++) {
                        data[offset + j] = value[j];
                    }
                } else if (layout.size === 1 && typeof value === "number") {
                    data[offset] = value;
                } else if (layout.size === 2) {
                    const { x, y } = value as { x: number; y: number };
                    data[offset] = x;
                    data[offset + 1] = y;
                } else if (layout.size === 3) {
                    const { x, y, z } = value as {
                        x: number;
                        y: number;
                        z: number;
                    };
                    data[offset] = x;
                    data[offset + 1] = y;
                    data[offset + 2] = z;
                } else {
                    throw new Error(
                        `Unsupported attribute '${layout.name}' value: ${JSON.stringify(value)}`,
                    );
                }
            });
        });
        return data;
    }

    setAttributes(attributes: TypeMap.JsTypeMap<Attributes>[]): this {
        const data = this.prepareData(
            this.attributesStride,
            this.attributesLayout,
            attributes,
        );
        this.attributes.setContent(data);
        return this;
    }

    setInstances(instances: TypeMap.JsTypeMap<Instances>[]): this {
        const data = this.prepareData(
            this.instancesStride,
            this.instancesLayout,
            instances,
        );
        this.instances.setContent(data);
        return this;
    }

    setElements(elements: number[] | Uint16Array | Uint8Array): this {
        this.elements.setContent(elements);
        return this;
    }

    setUniforms(data: Partial<TypeMap.JsTypeMap<Uniforms>>): this {
        const uniforms = this.source.uniforms;
        for (const i in data) {
            const value = data[i];
            let array: number[];

            if (typeof value === "number") {
                array = [value];
            } else if (Array.isArray(value)) {
                array = value;
            } else if (value instanceof Texture) {
                const index = this.textureIndexes.get(i)!;
                this.textureInstances.set(index, value);
                array = [index];
            } else if (uniforms[i] === Type.Vector2) {
                const { x, y } = value as { x: number; y: number };
                array = [x, y];
            } else if (uniforms[i] === Type.Vector3) {
                const { x, y, z } = value as {
                    x: number;
                    y: number;
                    z: number;
                };
                array = [x, y, z];
            } else {
                throw new Error(
                    `Invalid value for uniform '${i}', expected ${uniforms[i]}`,
                );
            }
            this.program.setUniform(i, array);
        }
        return this;
    }

    draw(
        instancesCount = this.instancesStride
            ? this.instances.length / this.instancesStride
            : null,
        verticesCount = this.attributesStride
            ? this.attributes.length / this.attributesStride
            : null,
        elementsCount = this.elements.length,
    ) {
        const gl = this.gl;

        gl.settings()
            .program(this.program)
            .enabledAttributes(
                Object.keys(this.program.attributes)
                    .map(key => {
                        return this.program.attributes[key]?.location;
                    })
                    .filter(v => v !== null && v !== undefined),
            )
            .instancedAttributes(
                this.instancesLayout
                    .map(v => v.name)
                    .map(key => {
                        return this.program.attributes[key]?.location;
                    })
                    .filter(v => v !== null && v !== undefined),
            )
            .textures(
                Array.from(this.textureInstances.entries()).reduce(
                    (r, [index, texture]) => {
                        r[index] = texture;
                        return r;
                    },
                    new Array<Texture | null>(16).fill(null),
                ),
            )
            .apply(() => {
                if (instancesCount !== null && elementsCount !== 0) {
                    gl.settings()
                        .elementsBuffer(this.elements)
                        .apply(() => {
                            gl.drawsInstancedElements(
                                this.primitivesType,
                                elementsCount,
                                instancesCount,
                            );
                        });
                } else if (instancesCount !== null && verticesCount !== null) {
                    gl.drawInstancedArrays(
                        this.primitivesType,
                        verticesCount,
                        instancesCount,
                    );
                } else if (elementsCount !== 0) {
                    gl.settings()
                        .elementsBuffer(this.elements)
                        .apply(() => {
                            gl.drawsElements(
                                this.primitivesType,
                                elementsCount,
                            );
                        });
                } else if (verticesCount) {
                    gl.drawArrays(this.primitivesType, verticesCount);
                } else {
                    throw new Error("Invalid draw dataset");
                }
            });
    }

    dispose() {
        this.program.dispose();
        this.attributes.dispose();
        this.instances.dispose();
        this.elements.dispose();
    }
}

/**
 * The main function of this library creates a command with specified parameters and shaders
 * @param gl
 * @param primitivesType Type of primitives to draw
 * @param config Description of attributes, uniforms, varyings, and shaders
 */
export function command<
    Uniforms extends TypeMap,
    Attributes extends TypeMap,
    Instances extends TypeMap,
    Varyings extends TypeMap = {},
>(
    gl: Gl,
    primitivesType: PrimitivesType,
    config: SourceConfig<Uniforms, Attributes, Instances, Varyings>,
) {
    return new Command(gl, primitivesType, source(config));
}
