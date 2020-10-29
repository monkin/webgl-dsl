import { BlendFunction, Gl, PrimitivesType, Type, val } from "../src";

function eachFrame(callback: () => void) {
    requestAnimationFrame(() => {
        callback();
        eachFrame(callback);
    });
}

function normalRandom() {
    const v = Math.random();
    let u = Math.random();
    while (u === 0) {
        u = Math.random();
    }
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const width = canvas.width = canvas.clientWidth * devicePixelRatio;
    const height = canvas.height = canvas.clientHeight * devicePixelRatio;

    const gl = new Gl(canvas, { preserveDrawingBuffer: true });

    const drawParticles = gl.command(PrimitivesType.Points, {
        uniforms: {
            uTime: Type.Scalar,
            uSource: Type.Vector2,
            uTarget: Type.Vector2,
        },
        instances: {
            iOffset: Type.Vector2,
            iAmplitude: Type.Scalar,
            iColor: Type.Vector4,
            iPhase: Type.Scalar,
            iScale: Type.Scalar,
            iSpeed: Type.Scalar,
        },
        attributes: {
            aPeriod: Type.Scalar,
            aPhase: Type.Scalar,
        },
        varyings: {
            vColor: Type.Vector4,
        },
        vertex({ uTime, uSource, uTarget, iOffset, aPhase, iAmplitude, aPeriod, iPhase, iColor, iScale, iSpeed }) {
            const t = uTime.div(aPeriod.mul(iScale)).add(aPhase).memMQ();
            const n = uTarget.sub(uSource).take(1, 0).mul(val(-1, 1)).normalize().memMQ();
            const shift = t.add(iPhase).add(aPhase).mul(Math.PI * 2).sin().mul(n).mul(iAmplitude).mul(n).add(iOffset).memMQ();
            const position = uSource.mix(uTarget, t.mul(iSpeed).mod(1).vec2()).add(shift).cat(val(0, 1)).memHQ();
            return {
                gl_Position: position.add(val(0, position.x().add(1).mul(Math.PI).sin().mul(0.25), 0, 0)),
                gl_PointSize: val(1),
                vColor: iColor,
            };
        },
        fragment({ vColor }) {
            return {
                gl_FragColor: vColor,
            };
        },
    }).setUniforms({
        uSource: [-1.1, 0],
        uTarget: [1.1, 0],
    }).setAttributes(new Array(500).fill(null).map(() => {
        return {
            aPeriod: 3000 + Math.random() * 500,
            aPhase: Math.random(),
        };
    })).setInstances(new Array(500).fill(null).map((_, i) => ({
        iAmplitude: Math.random() * 0.1,
        iOffset: [Math.random() * 0.05, normalRandom() * 0.1],
        iColor: [
            0.9 * (i % 3 === 0 ? 1 : 0),
            0.9 * (i % 3 === 1 ? 1 : 0),
            0.9 * (i % 3 === 2 ? 1 : 0),
            Math.random() * 0.15 + 0.45
        ],
        iPhase: Math.random(),
        iScale: Math.random() * 0.2 + 0.9,
        iSpeed: Math.random() * 0.2 + 0.9,
    })));

    const time = (() => {
        const zero = Date.now() - 3000;
        return () => Date.now() - zero;
    })();
    

    eachFrame(() => {
        gl.settings()
            .viewport(0, 0, width, height)
            .clearColor(0, 0, 0, 1)
            .blend(true)
            .blendFunction(BlendFunction.SrcAlpha, BlendFunction.One, BlendFunction.OneMinusSrcAlpha, BlendFunction.One)
            .apply(() => {
                gl.cleanColorBuffer();
                drawParticles.setUniforms({
                    uTime: time(),
                }).draw();
            });
    });
});
