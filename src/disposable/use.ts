import type { Disposable } from "./disposable";

export function use<T extends Disposable, R>(
    item: T,
    callback: (item: T) => R,
): R {
    try {
        return callback(item);
    } finally {
        item.dispose();
    }
}
