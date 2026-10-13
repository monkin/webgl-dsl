import { Gl } from "./gl";

/**
 * A stand-in WebGL context over a plain `EventTarget` canvas: every GL call
 * is a no-op answering `null`, recorded in `calls` by name. `lose()` and
 * `restore()` flip `isContextLost()` and dispatch the events a browser would.
 */
function fakeContext() {
    const canvas = new EventTarget();
    const calls: string[] = [];
    let lost = false;
    let fetches = 0;
    const context = new Proxy(
        {},
        {
            get(_target, name) {
                if (name === "canvas") return canvas;
                if (name === "isContextLost") return () => lost;
                if (name === "getExtension") {
                    return (extension: string) => {
                        calls.push(`getExtension:${extension}`);
                        fetches += 1;
                        return {
                            extension,
                            fetch: fetches,
                            loseContext: () => calls.push("loseContext"),
                        };
                    };
                }
                if (typeof name !== "string") return undefined;
                return () => {
                    calls.push(name);
                    return null;
                };
            },
        },
    ) as unknown as WebGLRenderingContext;

    const lose = (): Event => {
        lost = true;
        const event = new Event("webglcontextlost", { cancelable: true });
        canvas.dispatchEvent(event);
        return event;
    };
    const restore = (): void => {
        lost = false;
        canvas.dispatchEvent(new Event("webglcontextrestored"));
    };

    return { context, calls, lose, restore };
}

describe("Gl context loss", () => {
    it("prevents the default of a loss, so the browser may restore", () => {
        const { context, lose } = fakeContext();
        using gl = new Gl(context);

        expect(lose().defaultPrevented).toBe(true);
    });

    it("tells its listeners of a loss and a restore until they are removed", () => {
        const { context, lose, restore } = fakeContext();
        using gl = new Gl(context);
        const lost = vi.fn();
        const restored = vi.fn();
        const lostSubscription = gl.onContextLost(lost);
        const restoredSubscription = gl.onContextRestored(restored);

        lose();
        restore();
        lostSubscription[Symbol.dispose]();
        restoredSubscription[Symbol.dispose]();
        lose();
        restore();

        expect(lost).toHaveBeenCalledTimes(1);
        expect(restored).toHaveBeenCalledTimes(1);
    });

    it("fetches its extensions again on a restore", () => {
        const { context, calls, lose, restore } = fakeContext();
        using gl = new Gl(context);
        const before = gl.instancedArraysExtension;

        lose();
        calls.length = 0;
        restore();

        expect(gl.instancedArraysExtension).not.toBe(before);
        expect(calls).toEqual(
            expect.arrayContaining([
                "getExtension:ANGLE_instanced_arrays",
                "getExtension:EXT_blend_minmax",
                "getExtension:EXT_sRGB",
            ]),
        );
    });

    it("makes no GL call to free a resource made before a restore", () => {
        const { context, calls, lose, restore } = fakeContext();
        using gl = new Gl(context);
        const texture = gl.texture({ width: 1, height: 1 });
        const resources: Disposable[] = [
            gl.arrayBuffer(),
            gl.elementsBuffer(),
            texture,
            gl.renderBuffer(1, 1),
            gl.frameBuffer(texture),
            gl.program("void main() {}", "void main() {}"),
        ];

        lose();
        restore();
        calls.length = 0;
        for (const resource of resources) resource[Symbol.dispose]();

        expect(calls.filter(call => call.startsWith("delete"))).toEqual([]);
    });

    it("makes no GL call to free a resource while the context is lost", () => {
        const { context, calls, lose } = fakeContext();
        using gl = new Gl(context);
        const buffer = gl.arrayBuffer();

        lose();
        calls.length = 0;
        buffer[Symbol.dispose]();

        expect(calls).not.toContain("deleteBuffer");
    });

    it("frees a resource made after the restore as usual", () => {
        const { context, calls, lose, restore } = fakeContext();
        using gl = new Gl(context);

        lose();
        restore();
        const buffer = gl.arrayBuffer();
        calls.length = 0;
        buffer[Symbol.dispose]();

        expect(calls).toContain("deleteBuffer");
    });

    it("stops listening once disposed, and loses its context", () => {
        const { context, calls, lose } = fakeContext();
        const gl = new Gl(context);
        const lost = vi.fn();
        gl.onContextLost(lost);

        gl[Symbol.dispose]();
        const event = lose();

        expect(event.defaultPrevented).toBe(false);
        expect(lost).not.toHaveBeenCalled();
        expect(calls).toContain("loseContext");
    });

    it("throws when the canvas gives no WebGL context", () => {
        class FakeCanvas {
            getContext() {
                return null;
            }
        }
        vi.stubGlobal("HTMLCanvasElement", FakeCanvas);
        try {
            expect(
                () => new Gl(new FakeCanvas() as unknown as HTMLCanvasElement),
            ).toThrow("WebGL is unavailable");
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
