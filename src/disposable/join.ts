import type { Disposable } from "./disposable";

class JoinedDisposable<T extends Disposable[]> implements Disposable {
    constructor(public readonly values: T) {}
    dispose(): void {
        this.values.forEach(v => v.dispose());
    }
}

export function join<T extends Disposable[]>(
    ...items: T
): { readonly values: T; dispose(): void } {
    return new JoinedDisposable(items);
}
