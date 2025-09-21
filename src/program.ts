import { Disposable } from "./disposable";
import {
    ACTIVE_ATTRIBUTES,
    ACTIVE_UNIFORMS,
    BOOL,
    COMPILE_STATUS,
    FLOAT,
    FLOAT_MAT2,
    FLOAT_MAT3,
    FLOAT_MAT4,
    FLOAT_VEC2,
    FLOAT_VEC3,
    FLOAT_VEC4,
    LINK_STATUS,
    SAMPLER_2D,
} from "./consts";
import { ShaderType } from "./enums";
import { Gl } from "./gl";
import { ArrayBuffer } from "./array-buffer";

/**
 * Geometry or fragment shader.
 */
export class Shader implements Disposable {
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
}

export interface AttributeRecord {
    location: number;
    type: number;
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
