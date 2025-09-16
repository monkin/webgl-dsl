import { Disposable, use, uses } from "./disposable";

// Primitive stub classes/utilities for testing (no mocks)
class SimpleDisposable implements Disposable {
    public disposed = false;
    constructor(public readonly name: string, private readonly log: string[]) {}
    dispose(): void {
        this.disposed = true;
        this.log.push(`dispose:${this.name}`);
    }
}

class ThrowsOnCreation implements Disposable {
    // Should never be called because constructor throws
    dispose(): void {
        /* noop */
    }
    constructor() {
        throw new Error("creation failed");
    }
}

describe("Disposable.join", () => {
    test("disposes all items in order", () => {
        const log: string[] = [];
        const a = new SimpleDisposable("a", log);
        const b = new SimpleDisposable("b", log);
        const c = new SimpleDisposable("c", log);

        const joined = Disposable.join(a, b, c);
        joined.dispose();

        expect(a.disposed).toBe(true);
        expect(b.disposed).toBe(true);
        expect(c.disposed).toBe(true);
        expect(log).toEqual(["dispose:a", "dispose:b", "dispose:c"]);
    });

    test("works with zero items (no-throw)", () => {
        const joined = Disposable.join();
        expect(() => joined.dispose()).not.toThrow();
    });
});

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

describe("uses (varargs creators + callback)", () => {
    test("creates resources, passes them to callback, disposes in reverse order after callback", () => {
        const log: string[] = [];
        let seenInCreate2: SimpleDisposable | undefined;
        let seenInCreate3: [SimpleDisposable, SimpleDisposable] | undefined;

        const value = uses(
            () => new SimpleDisposable("a", log),
            (a) => {
                seenInCreate2 = a as SimpleDisposable;
                return new SimpleDisposable("b", log);
            },
            (a, b) => {
                seenInCreate3 = [a as SimpleDisposable, b as SimpleDisposable];
                return new SimpleDisposable("c", log);
            },
            (a, b, c) => {
                // Received all three resources
                expect(a).toBeInstanceOf(SimpleDisposable);
                expect(b).toBeInstanceOf(SimpleDisposable);
                expect(c).toBeInstanceOf(SimpleDisposable);
                return "ok";
            },
        ) as string;

        // returned value propagated
        expect(value).toBe("ok");

        // creators saw previous resources
        expect(seenInCreate2!.name).toBe("a");
        expect(seenInCreate3![0].name).toBe("a");
        expect(seenInCreate3![1].name).toBe("b");

        // disposed in reverse order of creation (c, b, a)
        expect(log).toEqual(["dispose:c", "dispose:b", "dispose:a"]);
    });

    test("rolls back already created resources if a creator throws (reverse order)", () => {
        const log: string[] = [];
        const create1 = () => new SimpleDisposable("a", log);
        const create2 = (_a: Disposable) => new SimpleDisposable("b", log);
        const create3 = (_a: Disposable, _b: Disposable) => new ThrowsOnCreation();
        const callback = () => "should not be called";

        expect(() => uses(create1, create2, create3 as any, callback as any)).toThrow(
            /creation failed/,
        );

        // On failure, only a and b were created, and both must be disposed in reverse
        expect(log).toEqual(["dispose:b", "dispose:a"]);
    });

    test("disposes created resources if callback throws (reverse order)", () => {
        const log: string[] = [];
        expect(() =>
            uses(
                () => new SimpleDisposable("a", log),
                (_a) => new SimpleDisposable("b", log),
                (_a, _b) => new SimpleDisposable("c", log),
                () => {
                    throw new Error("callback failed");
                },
            ),
        ).toThrow("callback failed");
        expect(log).toEqual(["dispose:c", "dispose:b", "dispose:a"]);
    });

    test("works with a single creator", () => {
        const log: string[] = [];
        const result = uses(
            () => new SimpleDisposable("one", log),
            (one) => {
                expect(one).toBeInstanceOf(SimpleDisposable);
                return 7;
            },
        ) as number;
        expect(result).toBe(7);
        expect(log).toEqual(["dispose:one"]);
    });
});

describe("Disposable.create (array-return variant)", () => {
    test("returns created resources in order and allows manual disposal later", () => {
        const log: string[] = [];
        const seen: Disposable[] = [];
        const [a, b, c] = Disposable.create(
            () => new SimpleDisposable("a", log),
            (a) => {
                seen.push(a);
                return new SimpleDisposable("b", log);
            },
            (a, b) => {
                seen.push(a, b);
                return new SimpleDisposable("c", log);
            },
        ) as [SimpleDisposable, SimpleDisposable, SimpleDisposable];

        // verify creators saw prior resources
        expect(seen.length).toBe(3);
        expect((seen[0] as SimpleDisposable).name).toBe("a");
        expect((seen[1] as SimpleDisposable).name).toBe("a");
        expect((seen[2] as SimpleDisposable).name).toBe("b");

        // nothing disposed yet (manual control)
        expect(log).toEqual([]);

        // manual disposal in any order is allowed by the API
        c.dispose();
        b.dispose();
        a.dispose();
        expect(log).toEqual(["dispose:c", "dispose:b", "dispose:a"]);
    });

    test("rolls back (disposes created) in reverse order when a creator throws and rethrows the error", () => {
        const log: string[] = [];
        expect(() =>
            Disposable.create(
                () => new SimpleDisposable("a", log),
                (_a) => new SimpleDisposable("b", log),
                (_a, _b) => new ThrowsOnCreation(),
            ),
        ).toThrow(/creation failed/);

        expect(log).toEqual(["dispose:b", "dispose:a"]);
    });

});
