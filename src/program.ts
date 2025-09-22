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
import { AttributeDataType, ShaderType, UniformDataType } from "./enums";
import { Gl } from "./gl";
import { ArrayBuffer } from "./array-buffer";

declare const AttributeLocationTag: unique symbol;
export type AttributeLocation = number & { [AttributeLocationTag]: true };
export type UniformLocation = WebGLUniformLocation;

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
    name: string;
    location: UniformLocation;
    type: UniformDataType;
}

export interface AttributeRecord {
    name: string;
    location: AttributeLocation;
    type: AttributeDataType;
}

export class Program implements Disposable {
    readonly handle: WebGLProgram;

    readonly uniforms = new Map<string, UniformRecord>();
    readonly attributes = new Map<string, AttributeRecord>();

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
                this.uniforms.set(info.name, {
                    name: info.name,
                    type: info.type,
                    location: gl.handle.getUniformLocation(handle, info.name)!,
                });
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
                this.attributes.set(info.name, {
                    name: info.name,
                    type: info.type,
                    location: i as AttributeLocation,
                });
            }
        }
    }

    setUniform(name: string, value: number[]) {
        const { gl, uniforms } = this;
        const uniform = uniforms.get(name);
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

    dispose() {
        this.gl.handle.deleteProgram(this.handle);
    }
}
