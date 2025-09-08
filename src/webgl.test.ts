import * as gl from "gl";
import { Gl, TextureFormat } from "./webgl";
import { use, uses } from "./disposable";

describe("webgl", () => {
    it("should clear part of the screen", () => {
        use(new Gl(gl(64, 64)), gl => {
            gl.settings()
                .viewport(0, 0, 64, 64)
                .clearColor(0.5, 0.5, 0.5, 1)
                .apply(() => {
                    gl.clearColorBuffer();

                    gl.settings()
                        .clearColor(1.0, 0.75, 0.75, 1)
                        .scissorTest(true)
                        .scissorBox(16, 16, 32, 32)
                        .apply(() => {
                            gl.clearColorBuffer();
                        });

                    expect(gl).toMatchImageSnapshot();
                });
        });
    });

    it("should clear a part of a texture", () => {
        uses(
            () => new Gl(gl(16, 16)),
            context =>
                context.texture({
                    width: 64,
                    height: 64,
                    format: TextureFormat.Rgba,
                }),
            (gl, texture) => {
                gl.settings()
                    .renderTarget(texture)
                    .viewport(0, 0, 64, 64)
                    .clearColor(0.5, 0.5, 0.5, 1)
                    .apply(() => {
                        gl.clearColorBuffer();

                        gl.settings()
                            .clearColor(0.5, 0.75, 0.75, 1)
                            .scissorTest(true)
                            .scissorBox(16, 16, 32, 32)
                            .apply(() => {
                                gl.clearColorBuffer();
                            });
                    });

                expect(texture).toMatchImageSnapshot();
            },
        );
    });
});
