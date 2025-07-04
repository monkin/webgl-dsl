/**
 * Resource that have to be destroyed manually (textures, tuffers, etc.)
 */
export interface Disposable {
    dispose(): void;
}

export namespace Disposable {
    /**
     * Compose an array of resources into a single disposable object
     */
    export function join(...items: Disposable[]): Disposable {
        return {
            dispose() {
                items.forEach(v => v.dispose());
            },
        };
    }
}

/**
 * Pass a disposable object into function and destroy it after the call
 */
export function use<T extends Disposable, R>(
    item: T,
    callback: (item: T) => R,
) {
    try {
        return callback(item);
    } finally {
        item.dispose();
    }
}

/**
 * The same as 'use', but it works with multiple resources and expects value constructors instead of values
 */
export function uses<Items extends (() => Disposable)[]>(
    ...constructors: Items
) {
    return <R>(
        callback: (
            ...items: {
                [key in keyof Items]: Items[key] extends () => Disposable
                    ? ReturnType<Items[key]>
                    : never;
            }
        ) => R,
    ): R => {
        const values: Disposable[] = [];
        try {
            constructors.forEach(c => {
                values.push(c());
            });

            return callback(...(values as any));
        } finally {
            values.forEach(v => v.dispose());
        }
    };
}
