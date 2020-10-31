# WebGL wrapper with strong typed GLSL DSL

[Documentation](https://monkin.github.io/webgl-dsl/doc)

## Examples

* [Minimal triangle](https://monkin.github.io/webgl-dsl/examples/build/triangle.html)
    ([source](https://github.com/monkin/webgl-dsl/blob/master/examples/triangle.ts))
* [Draw particles with ANGLE_instanced_arrays](https://monkin.github.io/webgl-dsl/examples/build/particles.html)
    ([source](https://github.com/monkin/webgl-dsl/blob/master/examples/particles.ts))
* [Normals map](https://monkin.github.io/webgl-dsl/examples/build/normals-map.html)
    ([source](https://github.com/monkin/webgl-dsl/blob/master/examples/normals-map.ts))

## Code sample

Here is a code you need to draw a triangle using WebGL-DSL

```typescript
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
        gl.cleanColorBuffer();
        drawTriangles.draw();
    });
```