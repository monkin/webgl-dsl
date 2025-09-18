import { Disposable, uses } from ".";

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

class ThrowsOnCreation implements Disposable {
    constructor() {
        throw new Error("creation failed");
    }
    dispose(): void {
        /* noop */
    }
}

describe("uses", () => {
    test("creates resources, passes them to callback, disposes in reverse order after callback", () => {
        const log: string[] = [];
        let seenInCreate2: SimpleDisposable | undefined;
        let seenInCreate3: [SimpleDisposable, SimpleDisposable] | undefined;

        const value = uses(
            () => new SimpleDisposable("a", log),
            a => {
                seenInCreate2 = a as SimpleDisposable;
                return new SimpleDisposable("b", log);
            },
            (a, b) => {
                seenInCreate3 = [a as SimpleDisposable, b as SimpleDisposable];
                return new SimpleDisposable("c", log);
            },
            (a, b, c) => {
                expect(a).toBeInstanceOf(SimpleDisposable);
                expect(b).toBeInstanceOf(SimpleDisposable);
                expect(c).toBeInstanceOf(SimpleDisposable);
                return "ok";
            },
        ) as string;

        expect(value).toBe("ok");
        expect(seenInCreate2!.name).toBe("a");
        expect(seenInCreate3![0].name).toBe("a");
        expect(seenInCreate3![1].name).toBe("b");
        expect(log).toEqual(["dispose:c", "dispose:b", "dispose:a"]);
    });

    test("disposes already created resources if a later creator throws (reverse order)", () => {
        const log: string[] = [];
        expect(() =>
            uses(
                () => new SimpleDisposable("a", log),
                _a => new SimpleDisposable("b", log),
                (_a, _b) => {
                    throw new Error("boom");
                },
                () => "should not reach",
            ),
        ).toThrow("boom");
        expect(log).toEqual(["dispose:b", "dispose:a"]);
    });

    test("disposes already created resources if the callback throws (reverse order)", () => {
        const log: string[] = [];
        expect(() =>
            uses(
                () => new SimpleDisposable("a", log),
                _a => new SimpleDisposable("b", log),
                (_a, _b) => new SimpleDisposable("c", log),
                () => {
                    throw new Error("callback failed");
                },
            ),
        ).toThrow("callback failed");
        expect(log).toEqual(["dispose:c", "dispose:b", "dispose:a"]);
    });

    test("stops creation if a constructor throws and disposes previous ones", () => {
        const log: string[] = [];
        expect(() =>
            uses(
                () => new SimpleDisposable("a", log),
                () => new ThrowsOnCreation(),
                () => new SimpleDisposable("c", log),
                () => "never",
            ),
        ).toThrow("creation failed");
        expect(log).toEqual(["dispose:a"]);
    });
});
