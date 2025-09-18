import { Disposable, use } from ".";

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

describe("use", () => {
    test("passes item to callback, returns value, and disposes after", () => {
        const log: string[] = [];
        const item = new SimpleDisposable("x", log);
        const result = use(item, it => {
            expect(it).toBe(item);
            return 42;
        });
        expect(result).toBe(42);
        expect(item.disposed).toBe(true);
        expect(log).toEqual(["dispose:x"]);
    });

    test("disposes item even if callback throws", () => {
        const log: string[] = [];
        const item = new SimpleDisposable("y", log);
        expect(() =>
            use(item, () => {
                throw new Error("boom");
            }),
        ).toThrow("boom");
        expect(item.disposed).toBe(true);
        expect(log).toEqual(["dispose:y"]);
    });
});
