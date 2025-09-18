import { Disposable } from ".";

class SimpleDisposable implements Disposable {
    public disposed = false;
    constructor(
        public readonly name: string,
        private readonly log: string[],
    ) {}
    dispose(): void {
        this.disposed = true;
        this.log.push(`dispose:${this.name}`);
    }
}

describe("Disposable.join", () => {
    test("disposes all items in order", () => {
        const log: string[] = [];
        const a = new SimpleDisposable("a", log);
        const b = new SimpleDisposable("b", log);
        const c = new SimpleDisposable("c", log);

        const joined = (require(".").Disposable as any).join(a, b, c);
        joined.dispose();

        expect(a.disposed).toBe(true);
        expect(b.disposed).toBe(true);
        expect(c.disposed).toBe(true);
        expect(log).toEqual(["dispose:a", "dispose:b", "dispose:c"]);
    });

    test("works with zero items (no-throw)", () => {
        const joined = (require(".").Disposable as any).join();
        expect(() => joined.dispose()).not.toThrow();
    });
});
