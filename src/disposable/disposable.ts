import { join as joinFn } from "./join";
import { dispose as disposeFn } from "./dispose";
import { create as createFn } from "./create";

export interface Disposable {
    dispose(): void;
}

export namespace Disposable {
    export const join = joinFn;
    export const dispose = disposeFn;
    export const create = createFn;
}
