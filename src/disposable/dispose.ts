import type { Disposable } from "./disposable";

export function dispose(...items: Disposable[]): void {
    items.forEach(v => v.dispose());
}
