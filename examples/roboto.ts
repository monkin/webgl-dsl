import {
    BlendFunction,
    Gl,
    PrimitivesType,
    TextureFilter,
    Type,
    val,
} from "../src";

import font from "./roboto.json";
import image from "./roboto.png";
type CharInfo = (typeof font)["chars"][0];
type KerningInfo = (typeof font)["kernings"][0];

const fontSize = font.info.size;
const charsInfo = font.chars.reduce(
    (r, v) => {
        r[v.char] = v;
        return r;
    },
    {} as { [key: string]: CharInfo }
);
const kerningInfo = font.kernings;

function textToGeometry(text: string) {
    return text
        .split("")
        .map(char => {
            return charsInfo[char];
        })
        .reduce(
            (r, char, i, chars) => {
                let kerning = 0;

                if (i !== 0) {
                    const previous = chars[i - 1];
                    kerningInfo.forEach(({ first, second, amount }) => {
                        if (char.id === second && previous.id === first) {
                            kerning = amount;
                        }
                    });
                }

                r.chars.push({
                    iXY: [r.width + char.xoffset + kerning, char.yoffset],
                    iUV: [char.x, char.y],
                    iSize: [char.width, char.height],
                });
                r.width += char.xadvance + kerning;
                return r;
            },
            {
                width: 0,
                chars: [],
            } as {
                width: number;
                chars: {
                    iXY: number[];
                    iUV: number[];
                    iSize: number[];
                }[];
            }
        );
}

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

async function eachFrame(duration: number, render: (t: number) => void) {
    const start = Date.now();
    for (let t = start; t - start <= duration; t = Date.now()) {
        render((t - start) / duration);
        await nextFrame();
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const width = (canvas.width = canvas.clientWidth * devicePixelRatio);
    const height = (canvas.height = canvas.clientHeight * devicePixelRatio);

    const gl = new Gl(canvas);

    const texture = gl.texture({
        image: await loadImage(image),
        filter: TextureFilter.Linear,
    });

    const drawChars = gl
        .command(PrimitivesType.TriangleStrip, {
            uniforms: {
                uTransform: Type.Matrix3,
                uTexture: Type.Sampler,
                uTextureSize: Type.Vector2,
                uAlpha: Type.Scalar,
            },
            attributes: {
                aPosition: Type.Vector2,
            },
            instances: {
                iUV: Type.Vector2,
                iXY: Type.Vector2,
                iSize: Type.Vector2,
            },
            varyings: {
                vUV: Type.Vector2,
            },
            vertex({ aPosition, iXY, iUV, iSize, uTransform, uTextureSize }) {
                const position = aPosition.mul(iSize).memMQ();
                return {
                    gl_Position: uTransform
                        .mul(iXY.add(position).cat(1))
                        .take(0, 1)
                        .cat(val(0, 1)),
                    vUV: val(0, 1).sub(
                        iUV.add(position).div(uTextureSize).mul(val(-1, 1))
                    ),
                };
            },
            fragment({ uTexture, vUV, uAlpha }) {
                const t = uTexture.texture2D(vUV).memLQ();
                const r = t.r();
                const g = t.g();
                const b = t.b();
                const median = t.r().min(g).max(r.max(g).min(b));
                return {
                    gl_FragColor: val(
                        1,
                        1,
                        1,
                        median.smoothstep(0.43, 0.57).mul(uAlpha).pow(2.2)
                    ),
                };
            },
        })
        .setUniforms({
            uTexture: texture,
            uTextureSize: [texture.width, texture.height],
        })
        .setAttributes([
            { aPosition: [0, 0] },
            { aPosition: [1, 0] },
            { aPosition: [0, 1] },
            { aPosition: [1, 1] },
        ]);

    const phrases = [
        "Привет!",
        "Tere!",
        "Hello!",
        "Ahoj!",
        "Bonjour!",
        "Xαίρε!",
    ];

    for (let i = 0; ; i = (i + 1) % phrases.length) {
        const phrase = phrases[i];
        console.log(phrase);
        const { width: textWidth, chars: textData } = textToGeometry(phrase);
        drawChars.setInstances(textData);
        await eachFrame(3000, t => {
            gl.settings()
                .viewport(0, 0, width, height)
                .clearColor(0, 0, 0, 1)
                .blend(true)
                .blendFunction(
                    BlendFunction.SrcAlpha,
                    BlendFunction.One,
                    BlendFunction.OneMinusSrcAlpha,
                    BlendFunction.One
                )
                .apply(() => {
                    gl.cleanColorBuffer();
                    const scale = 1.8 / textWidth;
                    const shiftX = -0.9;
                    const shiftY = 52 / textWidth;
                    drawChars
                        .setUniforms({
                            uTransform: [
                                scale,
                                0,
                                2,
                                0,
                                -scale,
                                0,
                                shiftX,
                                shiftY,
                                1,
                            ],
                            uAlpha: 1 - Math.pow(Math.abs(t - 0.5) * 2, 8),
                        })
                        .draw();
                });
        });
    }
});
