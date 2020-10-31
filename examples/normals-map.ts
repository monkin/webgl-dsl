/// <reference types="./modules"/>

import { BlendFunction, Gl, PrimitivesType, TextureFilter, Type, val } from "../src";

import imageX1 from "./normals-map-x1.png";
import imageX2 from "./normals-map-x2.png";

function loadImage(src: string) {
    const image = new Image();
    return new Promise<HTMLImageElement>(resolve => {
        image.onload = () => {
            resolve(image);
        };
        image.src = src;
    });
}

function nextFrame() {
    return new Promise<number>(resolve => {
        requestAnimationFrame(() => resolve(Date.now()));
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById("image-link")?.setAttribute("href", imageX2);

    const image = await loadImage(devicePixelRatio > 1.25 ? imageX2 : imageX1);

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const gl = new Gl(canvas, { preserveDrawingBuffer: true });
    const texture = gl.texture({
        image: image,
        filter: TextureFilter.Linear,
    });

    const drawNormalsMap = gl.command(PrimitivesType.TriangleStrip, {
        uniforms: {
            uNormalsMap: Type.Sampler,
            uLightPosition: Type.Vector3,
        },
        attributes: {
            aPosition: Type.Vector2,
        },
        varyings: {
            vPosition: Type.Vector2,
        },
        vertex: ({ aPosition }) => {
            return {
                vPosition: aPosition,
                gl_Position: aPosition.mul(2).sub(1).cat(val(0, 1)),
            };
        },
        fragment: ({ uNormalsMap, vPosition, uLightPosition }) => {
            const lightDirection = uLightPosition.sub(vPosition.mul(2).sub(1).cat(0)).normalize().memMQ();
            const texel = uNormalsMap.texture2D(vPosition).memMQ();
            const normal = texel.take(0, 1, 2).mul(2).sub(1).mul(val(1, -1, 1)).memMQ();
            const diffuse = normal.dot(lightDirection).mul(2);
            const specular = lightDirection.reflect(normal).z().max(0).pow(4);
            const color = val(0.9, 0.9, 1).mul(diffuse.add(specular));
            return {
                gl_FragColor: color.pow(val(2.2).vec3()).cat(texel.a()),
            };
        },
    }).setUniforms({
        uNormalsMap: texture,
    }).setAttributes([
        { aPosition: [0, 0] },
        { aPosition: [1, 0] },
        { aPosition: [0, 1] },
        { aPosition: [1, 1] },
    ]);

    const start = Date.now();
    while (true) {
        const time = await nextFrame() - start;
        const period = 5000;
        const phase = time / period * 2 * Math.PI;

        drawNormalsMap.setUniforms({
            uLightPosition: [Math.cos(phase) * 1.5, Math.sin(phase) * 1.5, 1.2],
        });

        gl.settings()
            .clearColor(0, 0, 0, 1)
            .blend(true)
            .blendFunction(BlendFunction.SrcAlpha, BlendFunction.One, BlendFunction.OneMinusSrcAlpha, BlendFunction.One)
            .apply(() => {
                gl.cleanColorBuffer();
                drawNormalsMap.draw();
            });
    }
});
