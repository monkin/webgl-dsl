# Thin functional WebGL wrapper with strong typed GLSL DSL

[Documentation](https://monkin.github.io/webgl-dsl/docs)

## Installation

This library could be installed from npm repository

```
npm i --save webgl-dsl
```

## Examples

* [Minimal triangle](https://monkin.github.io/webgl-dsl/examples/triangle.html)
    ([source](https://github.com/monkin/webgl-dsl/blob/master/examples/triangle.ts))
* [Draw particles with ANGLE_instanced_arrays](https://monkin.github.io/webgl-dsl/examples/particles.html)
    ([source](https://github.com/monkin/webgl-dsl/blob/master/examples/particles.ts))
* [Normals map](https://monkin.github.io/webgl-dsl/examples/normals-map.html)
    ([source](https://github.com/monkin/webgl-dsl/blob/master/examples/normals-map.ts))
* [MSDF font rendering](https://monkin.github.io/webgl-dsl/examples/roboto.html)
    ([source](https://github.com/monkin/webgl-dsl/blob/master/examples/roboto.ts))

## Code sample

Here is a code you need to draw a triangle using WebGL-DSL

```typescript
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const width = canvas.width = canvas.clientWidth * devicePixelRatio;
const height = canvas.height = canvas.clientHeight * devicePixelRatio;

using gl = new Gl(canvas, { preserveDrawingBuffer: true });

using drawTriangles = gl.command(PrimitivesType.Triangles, {
    uniforms: {},
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
        return {
            gl_FragColor: vColor.pow(val(1 / 2.2).vec4()),
        };
    },
});

drawTriangles.setAttributes([
    { aColor: [1, 0, 0, 1], aPosition: [0, 1] },
    { aColor: [0, 1, 0, 1], aPosition: [-1, -1] },
    { aColor: [0, 0, 1, 1], aPosition: [1, -1] },
]);


gl.settings()
    .viewport(0, 0, width, height)
    .clearColor(0, 0, 0, 1)
    .apply(() => {
        gl.clearColorBuffer();
        drawTriangles.draw();
    });
```

## Resource management

Every GPU resource — `Gl`, `Command`, `Texture`, `FrameBuffer`, `RenderBuffer`,
`ArrayBuffer`, `ElementsBuffer`, `Program`, and `Shader` — implements the standard
[explicit resource management](https://github.com/tc39/proposal-explicit-resource-management)
protocol (`Symbol.dispose`). Declare them with `using` to release the underlying
WebGL objects automatically at the end of the enclosing scope, in reverse order:

```typescript
function readback(canvas: HTMLCanvasElement) {
    using gl = new Gl(canvas);
    using texture = gl.texture({ width: 256, height: 256 });

    // ...render into `texture` via a frame buffer...

    return texture.read();
} // texture and gl are disposed here, in reverse order
```

Resources that outlive a single scope (commands, textures kept across frames, …)
are not bound to a `using` declaration — dispose them explicitly when you are done:

```typescript
const drawTriangles = gl.command(PrimitivesType.Triangles, source);
// ...later...
drawTriangles[Symbol.dispose]();
```

> `using` requires TypeScript 5.2+, and the resources rely on native
> `Symbol.dispose` at runtime (every 2024+ browser and Node.js 20+).
