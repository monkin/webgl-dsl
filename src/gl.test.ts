import gl from "gl";
import { Gl } from "./gl";
import { TextureFormat } from "./enums";

describe("webgl", () => {
    it("should clear part of the screen", () => {
        using glContext = new Gl(gl(64, 64));
        glContext
            .settings()
            .viewport(0, 0, 64, 64)
            .clearColor(0.5, 0.5, 0.5, 1)
            .apply(() => {
                glContext.clearColorBuffer();

                glContext
                    .settings()
                    .clearColor(1.0, 0.75, 0.75, 1)
                    .scissorTest(true)
                    .scissorBox(16, 16, 32, 32)
                    .apply(() => {
                        glContext.clearColorBuffer();
                    });

                expect(glContext).toMatchImageSnapshot();
            });
    });

    it("should clear a part of a texture", () => {
        using glContext = new Gl(gl(16, 16));
        using texture = glContext.texture({
            width: 64,
            height: 64,
            format: TextureFormat.Rgba,
        });
        glContext
            .settings()
            .renderTarget(texture)
            .viewport(0, 0, 64, 64)
            .clearColor(0.5, 0.5, 0.5, 1)
            .apply(() => {
                glContext.clearColorBuffer();

                glContext
                    .settings()
                    .clearColor(0.5, 0.75, 0.75, 1)
                    .scissorTest(true)
                    .scissorBox(16, 16, 32, 32)
                    .apply(() => {
                        glContext.clearColorBuffer();
                    });
            });

        expect(texture).toMatchImageSnapshot();
    });
});
