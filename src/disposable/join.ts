import type { Disposable } from "./disposable";

export function join(...items: Disposable[]): Disposable {
    return {
        dispose() {
            items.forEach(v => v.dispose());
        },
    };
}
