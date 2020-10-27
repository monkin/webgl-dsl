import { Gl, PrimitivesType, Type, val } from "../src";

function eachFrame(callback: () => void) {
    requestAnimationFrame(() => {
        callback();
        eachFrame(callback);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const width = canvas.width = canvas.clientWidth * devicePixelRatio;
    const height = canvas.height = canvas.clientHeight * devicePixelRatio;

    const gl = new Gl(canvas, { preserveDrawingBuffer: true });

    const drawTriangles = gl.command(PrimitivesType.Triangles, {
        uniforms: {},
        instances: {},
        attributes: {
            aPosition: Type.Vector2,
            aColor: Type.Vector4,
        },
        varyings: {
            vColor: Type.Vector4,
        },
        vertex({ aPosition, aColor }) {
            return {
                gl_Position: val(aPosition.mul(0.75), 0, 1),
                vColor: aColor,
            };
        },
        fragment({ vColor }) {
            const p = 1 / 2.2;
            return {
                gl_FragColor: vColor.pow(val(p, p, p, p)),
            };
        },
    });

    drawTriangles.setAttributes([
        { aColor: [1, 0, 0, 1], aPosition: [0, 1] },
        { aColor: [0, 1, 0, 1], aPosition: [-1, -1] },
        { aColor: [0, 0, 1, 1], aPosition: [1, -1] },
    ]);
    
    eachFrame(() => {
        gl.settings()
            .viewport(0, 0, width, height)
            .clearColor(0, 0, 0, 1)
            .apply(() => {
                gl.cleanColorBuffer();
                drawTriangles.draw();
            });
    });
});
