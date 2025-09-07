import * as gl from "gl";
import { uses } from "./disposable";
import { Gl, PrimitivesType, TextureFormat } from "./webgl";
import { Type, val } from "./dsl";

describe("DSL", () => {
    it("should handle memoized condition", () => {
        const context = gl(16, 16);
        uses(
            () => new Gl(context),
            gl =>
                gl.texture({
                    width: 16,
                    height: 16,
                    format: TextureFormat.Rgba,
                }),
            gl =>
                gl
                    .command(PrimitivesType.TriangleFan, {
                        uniforms: {},
                        attributes: {
                            aPosition: Type.Vector2,
                        },
                        vertex: ({ aPosition }) => ({
                            gl_Position: aPosition.cat(val(0, 1)),
                        }),
                        fragment: ({ gl_FragCoord }) => ({
                            gl_FragColor: gl_FragCoord
                                .x()
                                .gt(8)
                                .memLQ()
                                .condLQ(val(1, 0, 0, 1), val(0, 1, 0, 1)),
                        }),
                    })
                    .setAttributes([
                        { aPosition: [-1, -1] },
                        { aPosition: [1, -1] },
                        { aPosition: [1, 1] },
                        { aPosition: [-1, 1] },
                    ]),
            (gl, texture, command) => {
                gl.settings()
                    .renderTarget(texture)
                    .viewport(0, 0, 16, 16)
                    .clearColor(0.5, 0.5, 0.5, 1)
                    .apply(() => {
                        gl.clearColorBuffer();
                        command.draw();
                    });
                expect(texture).toMatchImageSnapshot();
            },
        );
    });
});
