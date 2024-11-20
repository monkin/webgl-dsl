import { Texture } from "./webgl";

const id = (() => {
    let sequence = 0;
    return function id() {
        return sequence++;
    };
})();

export enum Type {
    Scalar = "float",
    Vector2 = "vec2",
    Matrix2 = "mat2",
    Vector3 = "vec3",
    Matrix3 = "mat3",
    Vector4 = "vec4",
    Matrix4 = "mat4",
    Boolean = "bool",
    Sampler = "sampler2D",
}

export enum Precision {
    High = "highp",
    Medium = "mediump",
    Low = "lowp",
}

export type TypeSize = 1 | 2 | 3 | 4;

export namespace Type {
    export function size(type: Type.Boolean | Type.Scalar | Type.Sampler): 1;
    export function size(type: Type.Vector2 | Type.Matrix2): 2;
    export function size(type: Type.Vector3 | Type.Matrix3): 3;
    export function size(type: Type.Vector4 | Type.Matrix4): 4;
    export function size(type: Type): TypeSize;
    export function size(type: Type): TypeSize {
        switch (type) {
            case Type.Boolean:
            case Type.Scalar:
            case Type.Sampler:
                return 1;
            case Type.Vector2:
            case Type.Matrix2:
                return 2;
            case Type.Vector3:
            case Type.Matrix3:
                return 3;
            case Type.Vector4:
            case Type.Matrix4:
                return 4;
        }
    }

    export function vector(size: 2): Type.Vector2;
    export function vector(size: 3): Type.Vector3;
    export function vector(size: 4): Type.Vector4;
    export function vector(size: 2 | 3 | 4): Type.AnyVector;
    export function vector(size: 2 | 3 | 4): Type.AnyVector {
        switch (size) {
            case 2:
                return Type.Vector2;
            case 3:
                return Type.Vector3;
            case 4:
                return Type.Vector4;
        }
    }

    export function numeric(size: 1): Type.Scalar;
    export function numeric(size: 2): Type.Vector2;
    export function numeric(size: 3): Type.Vector3;
    export function numeric(size: 4): Type.Vector4;
    export function numeric(size: TypeSize): Type.AnyNumeric;
    export function numeric(size: TypeSize): Type.AnyNumeric {
        switch (size) {
            case 1:
                return Type.Scalar;
            case 2:
                return Type.Vector2;
            case 3:
                return Type.Vector3;
            case 4:
                return Type.Vector4;
        }
    }

    export type Numeric<S extends TypeSize> = S extends 1
        ? Type.Scalar
        : S extends 2
          ? Type.Vector2
          : S extends 3
            ? Type.Vector3
            : Type.Vector4;

    export type GetSize<T extends Type.AnyNumeric> = T extends Type.Scalar
        ? 1
        : T extends Type.Vector2
          ? 2
          : T extends Type.Vector3
            ? 3
            : 4;

    export type Indexes<T extends Type.AnyVector> = T extends Type.Vector2
        ? 0 | 1
        : T extends Type.Vector3
          ? 0 | 1 | 2
          : 0 | 1 | 2 | 3;

    export type AnyVector = Type.Vector2 | Type.Vector3 | Type.Vector4;
    export type AnyMatrix = Type.Matrix2 | Type.Matrix3 | Type.Matrix4;
    export type AnyNumeric = Type.Scalar | AnyVector;

    export type JsType<T extends Type> = T extends Type.Scalar
        ? number
        : T extends Type.Vector2
          ? number[] | { x: number; y: number }
          : T extends Type.Vector3
            ? number[] | { x: number; y: number; z: number }
            : T extends Type.Vector4
              ? number[]
              : T extends Type.Matrix2
                ? number[]
                : T extends Type.Matrix3
                  ? number[]
                  : T extends Type.Matrix4
                    ? number[]
                    : T extends Type.Sampler
                      ? Texture
                      : never;

    export function isVector(v: Type): v is AnyVector {
        return v === Type.Vector2 || v === Type.Vector3 || v === Type.Vector4;
    }
    export function isMatrix(v: Type): v is AnyMatrix {
        return v === Type.Matrix2 || v === Type.Matrix3 || v === Type.Matrix4;
    }
}

export type Value<T extends Type = Type> = Readonly<{
    type: T;
    content: string;
}>;

export class GlslBuilder {
    private global = "";
    private local = "";

    constructor(private readonly cache = new Map<string, any>()) {}

    once<R>(id: string, callback: () => R): R {
        if (this.cache.has(id)) {
            return this.cache.get(id) as R;
        } else {
            const result = callback();
            this.cache.set(id, result);
            return result;
        }
    }
    getGlobal(): string {
        return this.global;
    }
    addGlobal(content: string): this {
        this.global += content;
        return this;
    }
    getLocal(): string {
        return this.local;
    }
    addLocal(content: string): this {
        this.local += content;
        return this;
    }

    child() {
        return new GlslBuilder(this.cache);
    }
}

export namespace Glsl {
    export type Boolean = Glsl<Type.Boolean>;
    export type Scalar = Glsl<Type.Scalar>;
    export type Vector2 = Glsl<Type.Vector2>;
    export type Vector3 = Glsl<Type.Vector3>;
    export type Vector4 = Glsl<Type.Vector4>;
    export type Matrix2 = Glsl<Type.Matrix2>;
    export type Matrix3 = Glsl<Type.Matrix3>;
    export type Matrix4 = Glsl<Type.Matrix4>;
    export type Sampler = Glsl<Type.Sampler>;
    export type AnyVector = Glsl<Type.AnyVector>;
    export type AnyNumeric = Glsl<Type.AnyNumeric>;
    export type AnyMatrix = Glsl<Type.AnyMatrix>;
}

const operators = "==+-*/<><=>=!&&||";

export class Glsl<T extends Type = Type> {
    constructor(public readonly getValue: (builder: GlslBuilder) => Value<T>) {}

    private static call(
        name: string,
        values: (Glsl | number)[],
        rtype: (types: Type[]) => Type
    ) {
        const isOperator = operators.indexOf(name) !== -1;
        const glsls = values.map(v => (typeof v === "number" ? val(v) : v));
        if (values.length === 2 && isOperator) {
            return new Glsl(builder => {
                const computed = glsls.map(v => v.getValue(builder));
                return {
                    type: rtype(computed.map(v => v.type)),
                    content: `((${computed[0].content}) ${name} (${computed[1].content}))`,
                };
            });
        } else {
            return new Glsl(builder => {
                const computed = glsls.map(v => v.getValue(builder));
                return {
                    type: rtype(computed.map(v => v.type)),
                    content: `${name}(${computed.map(v => v.content).join(", ")})`,
                };
            });
        }
    }

    private static unary<X extends Type = Type.AnyNumeric>(name: string) {
        return function <A extends X>(this: Glsl<A>): Glsl<A> {
            return Glsl.call(name, [this], t => t[0]) as Glsl<A>;
        };
    }

    sin = Glsl.unary("sin");
    cos = Glsl.unary("cos");
    radians = Glsl.unary("radians");
    degrees = Glsl.unary("degrees");
    tan = Glsl.unary("tan");
    asin = Glsl.unary("asin");
    acos = Glsl.unary("acos");

    exp = Glsl.unary("exp");
    log = Glsl.unary("log");
    exp2 = Glsl.unary("exp2");
    log2 = Glsl.unary("log2");
    sqrt = Glsl.unary("sqrt");
    inversesqrt = Glsl.unary("inversesqrt");

    abs = Glsl.unary("abs");
    sign = Glsl.unary("sign");
    floor = Glsl.unary("floor");
    ceil = Glsl.unary("floor");
    fract = Glsl.unary("fract");
    normalize = Glsl.unary("normalize");

    round<T extends Glsl.AnyNumeric>(this: T): T {
        return this.add(0.5).floor() as T;
    }

    not = Glsl.unary<Type.Boolean>("!");

    atan<T extends Type.AnyNumeric>(this: Glsl<T>): Glsl<T>;
    atan<T extends Type.AnyNumeric>(this: Glsl<T>, x: Glsl<T>): Glsl<T>;
    atan(this: Glsl.Scalar, x: number): Glsl.Scalar;
    atan(v?: Glsl.AnyNumeric | number): Glsl.AnyNumeric {
        if (v === undefined) {
            return Glsl.call(
                "atan",
                [this],
                ([type]) => type
            ) as Glsl.AnyNumeric;
        } else {
            return Glsl.call(
                "atan",
                [this, v],
                types => types[0]
            ) as Glsl.AnyNumeric;
        }
    }

    pow(this: Glsl.Scalar, p: Glsl.Scalar): Glsl.Scalar;
    pow(this: Glsl.Vector2, p: Glsl.Vector2): Glsl.Vector2;
    pow(this: Glsl.Vector3, p: Glsl.Vector3): Glsl.Vector3;
    pow(this: Glsl.Vector4, p: Glsl.Vector4): Glsl.Vector4;
    pow(this: Glsl.Scalar, p: number): Glsl.Scalar;
    pow(p: Glsl.AnyNumeric | number): Glsl<Type> {
        const pv = typeof p === "number" ? val(p) : p;
        return Glsl.call("pow", [this, pv], ([t]) => t);
    }

    mod<P extends Type.AnyNumeric>(this: Glsl<P>, p: Glsl<P>): Glsl<P>;
    mod(this: Glsl.Scalar, p: number): Glsl.Scalar;
    mod(p: Glsl.AnyNumeric | number): Glsl<Type> {
        const pv = typeof p === "number" ? val(p) : p;
        return Glsl.call("mod", [this, pv], ([t]) => t);
    }

    min<P extends Type.AnyNumeric>(this: Glsl<P>, p: Glsl<P>): Glsl<P>;
    min(this: Glsl.Scalar, p: number): Glsl.Scalar;
    min(p: Glsl.AnyNumeric | number): Glsl<Type> {
        const pv = typeof p === "number" ? val(p) : p;
        return Glsl.call("min", [this, pv], ([t]) => t);
    }

    max<P extends Type.AnyNumeric>(this: Glsl<P>, p: Glsl<P>): Glsl<P>;
    max(this: Glsl.Scalar, p: number): Glsl.Scalar;
    max(p: Glsl.AnyNumeric | number): Glsl<Type> {
        return Glsl.call("max", [this, p], ([t]) => t);
    }

    mix<P extends Glsl.AnyNumeric>(this: P, other: P, p: P): P;
    mix<P extends Glsl.AnyNumeric>(this: P, other: P, p: number): P;
    mix(this: Glsl.Scalar, other: number, p: Glsl.Scalar | number): Glsl.Scalar;
    mix(
        other: Glsl.AnyNumeric | number,
        p: Glsl.AnyNumeric | number
    ): Glsl<Type> {
        return Glsl.call("mix", [this, other, p], ([t]) => t);
    }

    clamp<T extends Glsl.AnyNumeric>(this: T, min: T, max: T): T;
    clamp<T extends Glsl.AnyNumeric>(
        this: T,
        min: Glsl.Scalar | number,
        max: Glsl.Scalar | number
    ): T;
    clamp(min: Glsl.AnyNumeric | number, max: Glsl.AnyNumeric | number): Glsl {
        return Glsl.call("clamp", [this, min, max], ([t]) => t);
    }

    smoothstep(
        this: Glsl.Scalar,
        edge1: Glsl.Scalar | number,
        edge2: Glsl.Scalar | number
    ): Glsl.Scalar;
    smoothstep<T extends Glsl.AnyNumeric>(this: T, edge1: T, edge2: T): T;
    smoothstep<T extends Glsl.AnyNumeric>(
        this: Glsl.Scalar,
        edge1: Glsl.Scalar | number,
        edge2: Glsl.Scalar | number
    ): T;
    smoothstep(edge1: Glsl | number, edge2: Glsl | number): Glsl {
        return Glsl.call("smoothstep", [edge1, edge2, this], ([t]) => t);
    }

    length(this: Glsl.AnyNumeric): Glsl.Scalar;
    length(): Glsl {
        return Glsl.call("length", [this], () => Type.Scalar);
    }

    distance<T extends Glsl.AnyNumeric>(this: T, other: T): Glsl.Scalar;
    distance(this: Glsl.Scalar, other: number): Glsl.Scalar;
    /**
     * Distance to other point
     */
    distance(other: Glsl | number): Glsl {
        return Glsl.call("distance", [this, other], () => Type.Scalar);
    }

    dot<T extends Glsl.AnyNumeric>(this: T, other: T): Glsl.Scalar;
    dot(this: Glsl.Scalar, other: number): Glsl.Scalar;
    /**
     * Dot product
     */
    dot(other: Glsl | number): Glsl {
        return Glsl.call("dot", [this, other], () => Type.Scalar);
    }

    reflect<T extends Glsl.AnyNumeric>(this: T, n: T): T;
    reflect(v: Glsl): Glsl {
        return Glsl.call("reflect", [this, v], ([t]) => t);
    }

    refract<T extends Glsl.AnyNumeric>(
        this: T,
        n: T,
        eta: Glsl.Scalar | number
    ): T;
    refract(n: Glsl, eta: Glsl | number): Glsl {
        return Glsl.call("refract", [this, n, eta], ([t]) => t);
    }

    /**
     * Get texture value at the specified point
     */
    texture2D = function (
        this: Glsl.Sampler,
        point: Glsl.Vector2
    ): Glsl.Vector4 {
        return Glsl.call(
            "texture2D",
            [this, point],
            () => Type.Vector4
        ) as Glsl.Vector4;
    };

    add<T extends Glsl.AnyNumeric | Glsl.AnyMatrix>(
        this: T,
        other: T | Glsl.Scalar | number
    ): T;
    add<T extends Glsl.AnyNumeric | Glsl.AnyMatrix>(
        this: Glsl.Scalar,
        other: T
    ): T;
    /**
     * Addition
     */
    add<T extends Glsl.AnyNumeric | Glsl.AnyMatrix>(
        this: T,
        other: T | Glsl.Scalar | number
    ): Glsl.AnyNumeric | Glsl.AnyMatrix {
        return Glsl.call("+", [this, other], ([t1, t2]) =>
            t1 === Type.Scalar ? t2 : t1
        ) as T;
    }

    sub<T extends Glsl.AnyNumeric | Glsl.AnyMatrix>(
        this: T,
        other: T | Glsl.Scalar | number
    ): T;
    sub<T extends Glsl.AnyNumeric | Glsl.AnyMatrix>(
        this: Glsl.Scalar,
        other: T
    ): T;
    /**
     * Substraction
     */
    sub<T extends Glsl.AnyNumeric | Glsl.AnyMatrix>(
        this: T,
        other: T | Glsl.Scalar | number
    ): Glsl.AnyNumeric | Glsl.AnyMatrix {
        return Glsl.call("-", [this, other], ([t1, t2]) =>
            t1 === Type.Scalar ? t2 : t1
        ) as T;
    }

    div<T extends Glsl.AnyNumeric | Glsl.AnyMatrix>(
        this: T,
        other: T | Glsl.Scalar | number
    ): T;
    div<T extends Glsl.AnyNumeric | Glsl.AnyMatrix>(
        this: Glsl.Scalar,
        other: T
    ): T;
    /**
     * Division
     */
    div<T extends Glsl.AnyNumeric | Glsl.AnyMatrix>(
        this: T,
        other: T | Glsl.Scalar | number
    ): Glsl.AnyNumeric | Glsl.AnyMatrix {
        return Glsl.call("/", [this, other], ([t1, t2]) =>
            t1 === Type.Scalar ? t2 : t1
        ) as T;
    }

    mul<T extends Glsl.AnyNumeric | Glsl.AnyMatrix>(
        this: T,
        other: T | Glsl.Scalar | number
    ): T;
    mul<T extends Glsl.AnyNumeric | Glsl.AnyMatrix>(
        this: Glsl.Scalar,
        other: T | Glsl.Scalar | number
    ): T;
    mul(this: Glsl.Matrix2, other: Glsl.Vector2): Glsl.Vector2;
    mul(this: Glsl.Vector2, other: Glsl.Matrix2): Glsl.Vector2;
    mul(this: Glsl.Matrix3, other: Glsl.Vector3): Glsl.Vector3;
    mul(this: Glsl.Vector3, other: Glsl.Matrix3): Glsl.Vector3;
    mul(this: Glsl.Matrix4, other: Glsl.Vector4): Glsl.Vector4;
    mul(this: Glsl.Vector4, other: Glsl.Matrix4): Glsl.Vector4;
    /**
     * Multiplication operation
     */
    mul<T extends Glsl.AnyNumeric | Glsl.AnyMatrix>(
        this: T,
        other: T | Glsl.Scalar | number
    ): T {
        return Glsl.call("*", [this, other], ([t1, t2]) => {
            if (t1 === Type.Scalar || t1 === t2) {
                return t2;
            } else if (t2 === Type.Scalar) {
                return t1;
            } else if (Type.isVector(t1)) {
                return t1;
            } else if (Type.isVector(t2)) {
                return t2;
            } else {
                return t1;
            }
        }) as T;
    }

    private static bool(name: string) {
        return function (
            this: Glsl.Scalar,
            other: Glsl.Scalar | number
        ): Glsl.Boolean {
            return Glsl.call(
                name,
                [this, other],
                () => Type.Boolean
            ) as Glsl.Boolean;
        };
    }

    /** Less */
    lt = Glsl.bool("<");
    /** Greater */
    gt = Glsl.bool(">");
    /** Less or equal */
    lte = Glsl.bool("<=");
    /** Greater or equal */
    gte = Glsl.bool(">=");
    /** Equal */
    eq = Glsl.bool("==");
    /** Not equal */
    neq = Glsl.bool("!=");

    and(this: Glsl.Boolean, other: Glsl.Boolean): Glsl.Boolean {
        return Glsl.call(
            "&&",
            [this, other],
            () => Type.Boolean
        ) as Glsl.Boolean;
    }
    or(this: Glsl.Boolean, other: Glsl.Boolean): Glsl.Boolean {
        return Glsl.call(
            "||",
            [this, other],
            () => Type.Boolean
        ) as Glsl.Boolean;
    }

    /**
     * Save some expression into a variable
     */
    mem<T extends Glsl>(this: T, precision: Precision): T {
        const name = `mem${id()}`;
        return new Glsl(builder => {
            const v = this.getValue(builder);
            builder.once(name, () => {
                builder.addLocal(
                    `${precision} ${v.type} ${name} = ${v.content};\n`
                );
            });
            return {
                type: v.type,
                content: name,
            };
        }) as T;
    }

    /**
     * Save some expression with high quality into a variable
     */
    memHQ() {
        return this.mem(Precision.High);
    }
    /**
     * Save some expression with medium quality into a variable
     */
    memMQ() {
        return this.mem(Precision.Medium);
    }
    /**
     * Save some expression with low quality into a variable
     */
    memLQ() {
        return this.mem(Precision.Low);
    }

    /**
     * Conditional expression
     * @param precision Precision of the expression result
     * @param whenTrue True brunch of the condition
     * @param whenFalse False brunch of the condition
     */
    cond<T extends Glsl>(
        this: Glsl.Boolean,
        precision: Precision,
        whenTrue: T,
        whenFalse: T
    ): T {
        const name = `cond${id()}`;
        let type: Type | null = null;
        return new Glsl(builder => {
            builder.once(name, () => {
                const trueBuilder = builder.child();
                const trueValue = whenTrue.getValue(trueBuilder);

                const falseBuilder = builder.child();
                const falseValue = whenFalse.getValue(falseBuilder);

                const condition = this.getValue(builder);

                type = trueValue.type;

                builder
                    .addGlobal(trueBuilder.getGlobal())
                    .addGlobal(falseBuilder.getGlobal());

                builder
                    .addLocal(
                        `${trueValue.type !== Type.Boolean ? precision + " " : ""}${trueValue.type} ${name};\n`
                    )
                    .addLocal(`if (${condition.content}) {\n`)
                    .addLocal(trueBuilder.getLocal())
                    .addLocal(`${name} = ${trueValue.content};\n`)
                    .addLocal("} else {\n")
                    .addLocal(falseBuilder.getLocal())
                    .addLocal(`${name} = ${falseValue.content};\n`)
                    .addLocal("}\n");
            });

            return {
                type: type!,
                content: name,
            };
        }) as T;
    }

    condHQ<T extends Glsl>(this: Glsl.Boolean, whenTrue: T, whenFalse: T): T {
        return this.cond(Precision.High, whenTrue, whenFalse);
    }
    condMQ<T extends Glsl>(this: Glsl.Boolean, whenTrue: T, whenFalse: T): T {
        return this.cond(Precision.Medium, whenTrue, whenFalse);
    }
    condLQ<T extends Glsl>(this: Glsl.Boolean, whenTrue: T, whenFalse: T): T {
        return this.cond(Precision.Low, whenTrue, whenFalse);
    }

    take<T extends Type.AnyVector>(
        this: Glsl<T>,
        i: Type.Indexes<T>
    ): Glsl.Scalar;
    take<T extends Type.AnyVector>(
        this: Glsl<T>,
        i1: Type.Indexes<T>,
        i2: Type.Indexes<T>
    ): Glsl.Vector2;
    take<T extends Type.Vector3 | Type.Vector4>(
        this: Glsl<T>,
        i1: Type.Indexes<T>,
        i2: Type.Indexes<T>,
        i3: Type.Indexes<T>
    ): Glsl.Vector3;
    take(
        this: Glsl.Vector4,
        i1: Type.Indexes<Type.Vector4>,
        i2: Type.Indexes<Type.Vector4>,
        i3: Type.Indexes<Type.Vector4>,
        i4: Type.Indexes<Type.Vector4>
    ): Glsl.Vector4;
    /**
     * Take one or more components from vector
     */
    take(i1: number, i2?: number, i3?: number, i4?: number): Glsl.AnyNumeric {
        return new Glsl(builder => {
            const indexes = [i1, i2, i3, i4].filter(
                i => i !== undefined
            ) as number[];
            const value = this.getValue(builder);
            return {
                type:
                    indexes.length === 1
                        ? Type.Scalar
                        : Type.vector(indexes.length as 2 | 3 | 4),
                content: `(${value.content}).${indexes
                    .map(i => {
                        return "xyzw".charAt(i);
                    })
                    .join("")}`,
            };
        });
    }

    vec2(this: Glsl.Scalar): Glsl.Vector2 {
        return new Glsl(builder => {
            return {
                type: Type.Vector2,
                content: `vec2(${this.getValue(builder).content})`,
            };
        });
    }

    vec3(this: Glsl.Scalar): Glsl.Vector3 {
        return new Glsl(builder => {
            return {
                type: Type.Vector3,
                content: `vec3(${this.getValue(builder).content})`,
            };
        });
    }

    vec4(this: Glsl.Scalar): Glsl.Vector4 {
        return new Glsl(builder => {
            return {
                type: Type.Vector4,
                content: `vec4(${this.getValue(builder).content})`,
            };
        });
    }

    /**
     * Get the first component of vector
     */
    x(this: Glsl.AnyVector) {
        return this.take(0);
    }
    /**
     * Get the second component of vector
     */
    y(this: Glsl.AnyVector) {
        return this.take(1);
    }
    /**
     * Get the third component of vector
     */
    z(this: Glsl.AnyVector) {
        return this.take(2);
    }
    /**
     * Get the fourth component of vector
     */
    w(this: Glsl.AnyVector) {
        return this.take(3);
    }

    /**
     * Get the first component of vector
     */
    r(this: Glsl.AnyVector) {
        return this.take(0);
    }
    /**
     * Get the second component of vector
     */
    g(this: Glsl.AnyVector) {
        return this.take(1);
    }
    /**
     * Get the third component of vector
     */
    b(this: Glsl.AnyVector) {
        return this.take(2);
    }
    /**
     * Get the fourth component of vector
     */
    a(this: Glsl.AnyVector) {
        return this.take(3);
    }

    cat(this: Glsl.Scalar, v: Glsl.Scalar | number): Glsl.Vector2;
    cat(this: Glsl.Scalar, v: Glsl.Vector2): Glsl.Vector3;
    cat(this: Glsl.Scalar, v: Glsl.Vector3): Glsl.Vector4;
    cat(this: Glsl.Vector2, v: Glsl.Scalar | number): Glsl.Vector3;
    cat(this: Glsl.Vector2, v: Glsl.Vector2): Glsl.Vector4;
    cat(this: Glsl.Vector3, v: Glsl.Scalar | number): Glsl.Vector4;
    /**
     * Create vector as a concatenation of current value and argument
     */
    cat(
        this: Glsl<Type.Scalar | Type.Vector2 | Type.Vector3>,
        v: Glsl<Type.Scalar | Type.Vector2 | Type.Vector3> | number
    ): Glsl.AnyNumeric {
        if (typeof v === "number") {
            return (this as Glsl.Scalar).cat(Glsl.val(v));
        } else {
            return new Glsl(builder => {
                const v1 = this.getValue(builder),
                    v2 = v.getValue(builder),
                    rt = Type.numeric(
                        (Type.size(v1.type) + Type.size(v2.type)) as TypeSize
                    );
                return {
                    type: rt,
                    content: `${rt}(${v1.content}, ${v2.content})`,
                };
            });
        }
    }

    static val(v: boolean): Glsl<Type.Boolean>;
    static val(v: number): Glsl.Scalar;
    static val<T extends Glsl>(v: T): T;
    static val(
        v1: Glsl.Scalar | number,
        v2: Glsl.Scalar | number
    ): Glsl.Vector2;
    static val(v1: Glsl.Scalar | number, v2: Glsl.Vector2): Glsl.Vector3;
    static val(v1: Glsl.Scalar | number, v2: Glsl.Vector3): Glsl.Vector4;
    static val(v1: Glsl.Vector2, v2: Glsl.Scalar | number): Glsl.Vector3;
    static val(v1: Glsl.Vector3, v2: Glsl.Scalar | number): Glsl.Vector4;

    static val(
        v1: Glsl.Scalar | number,
        v2: Glsl.Scalar | number,
        v3: Glsl.Scalar | number
    ): Glsl.Vector3;
    static val(
        v1: Glsl.Vector2,
        v2: Glsl.Scalar | number,
        v3: Glsl.Scalar | number
    ): Glsl.Vector4;
    static val(
        v1: Glsl.Scalar | number,
        v2: Glsl.Vector2,
        v3: Glsl.Scalar | number
    ): Glsl.Vector4;
    static val(
        v1: Glsl.Scalar | number,
        v2: Glsl.Scalar | number,
        v3: Glsl.Vector2
    ): Glsl.Vector4;

    static val(
        v1: Glsl.Scalar | number,
        v2: Glsl.Scalar | number,
        v3: Glsl.Scalar | number,
        v4: Glsl.Scalar | number
    ): Glsl.Vector4;

    /**
     * Wrap set of values into single GLSL value
     */
    static val(...values: (Glsl | number | boolean)[]): Glsl {
        if (values.length === 1) {
            if (typeof values[0] === "boolean") {
                return new Glsl(() => ({
                    type: Type.Boolean,
                    content: values[0] ? "1" : "0",
                }));
            } else if (values[0] instanceof Glsl) {
                return values[0];
            } else {
                const s = values[0].toString();
                return new Glsl(() => ({
                    type: Type.Scalar,
                    content: /[e\.]/.test(s) ? s : `${s}.0`,
                }));
            }
        } else if (values.some(v => typeof v === "number")) {
            const vs = values.map(v => Glsl.val(v as any));
            return Glsl.val.apply(null, vs as any);
        } else {
            return values.reduce((r, v) => (r as any).cat(v)) as Glsl;
        }
    }

    static PI = Glsl.val(Math.PI);
}

/**
 * Description of attributes/uniforms/varyings
 */
export type TypeMap = {
    [key: string]: Type | [Type, Precision];
};

export namespace TypeMap {
    export type GetType<T extends Type | [Type, Precision]> = T extends Type
        ? T
        : T[0];

    export type JsTypeMap<T extends TypeMap> = {
        [key in keyof T]: Type.JsType<GetType<T[key]>>;
    };

    export type ToValues<M extends TypeMap> = {
        [key in keyof M]: Glsl<GetType<M[key]>>;
    };

    export type WithoutPrecision<M extends TypeMap> = {
        [key in keyof M]: GetType<M[key]>;
    };

    export function getType(v: Type | [Type, Precision]): Type {
        return Array.isArray(v) ? v[0] : v;
    }
    export function getPrecision(v: Type | [Type, Precision]): Precision {
        return Array.isArray(v) ? v[1] : Precision.High;
    }

    export function withoutPrecision<M extends TypeMap>(
        map: M
    ): WithoutPrecision<M> {
        return Object.keys(map).reduce(
            (r, key) => {
                r[key] = getType(map[key]);
                return r;
            },
            {} as { [key: string]: Type }
        ) as WithoutPrecision<M>;
    }

    export function values(
        storage: "uniform" | "attribute" | "varying",
        types: TypeMap
    ) {
        const result: { [key: string]: Glsl } = {};
        Object.keys(types).forEach(name => {
            const type = types[name];
            result[name] = new Glsl(builder => {
                builder.once(`types_map_value_${name}`, () => {
                    builder.addGlobal(
                        `${storage} ${TypeMap.getPrecision(type)} ${TypeMap.getType(type)} ${name};\n`
                    );
                });
                return {
                    type: TypeMap.getType(type),
                    content: name,
                };
            });
        });
        return result;
    }

    export function stride(map: TypeMap) {
        let r = 0;
        for (const i in map) {
            r += Type.size(getType(map[i]));
        }
        return r;
    }

    export interface LayoutItem {
        name: string;
        size: number;
        stride: number;
        offset: number;
    }

    export function layout(map: TypeMap): LayoutItem[] {
        const s = stride(map);

        return Object.keys(map)
            .sort()
            .reduce((r, name) => {
                const previous = r.length ? r[r.length - 1] : null;
                r.push({
                    name: name,
                    stride: s,
                    size: Type.size(getType(map[name])),
                    offset: previous ? previous.offset + previous.size : 0,
                });
                return r;
            }, [] as LayoutItem[]);
    }
}

/**
 * Description of a shader program
 */
export type SourceConfig<
    Uniforms extends TypeMap,
    Attributes extends TypeMap,
    Instances extends TypeMap,
    Varyings extends TypeMap = {},
> = {
    uniforms: Uniforms;
    attributes: Attributes;
    instances?: Instances;
    varyings?: Varyings;
    vertex: (
        input: TypeMap.ToValues<Uniforms> &
            TypeMap.ToValues<Attributes> &
            TypeMap.ToValues<Instances>
    ) => TypeMap.ToValues<Varyings> & {
        gl_Position: Glsl.Vector4;
        gl_PointSize?: Glsl.Scalar;
    };
    fragment: (
        input: TypeMap.ToValues<Uniforms> &
            TypeMap.ToValues<Varyings> & {
                gl_FragCoord: Glsl.Vector4;
                gl_FrontFacing: Glsl.Boolean;
                gl_PointCoord: Glsl.Vector2;
            }
    ) => {
        gl_FragColor: Glsl.Vector4;
    };
};

export type ProgramSource<
    Uniforms extends TypeMap,
    Attributes extends TypeMap,
    Instances extends TypeMap,
> = {
    uniforms: Uniforms;
    attributes: Attributes;
    instances: Instances;
    fragment: string;
    vertex: string;
};

export namespace ProgramSource {
    export type GetUniforms<T extends ProgramSource<any, any, any>> =
        T extends ProgramSource<infer R, any, any> ? R : never;
    export type GetAttributes<T extends ProgramSource<any, any, any>> =
        T extends ProgramSource<any, infer R, any> ? R : never;
    export type GetInstances<T extends ProgramSource<any, any, any>> =
        T extends ProgramSource<any, any, infer R> ? R : never;
}

/**
 * Create GLSL program source from argument types and shaders described with the DSL
 */
export function source<
    Uniforms extends TypeMap,
    Attributes extends TypeMap,
    Instances extends TypeMap,
    Varyings extends TypeMap = {},
>({
    uniforms,
    attributes,
    varyings,
    instances,
    fragment,
    vertex,
}: SourceConfig<Uniforms, Attributes, Instances, Varyings>): ProgramSource<
    TypeMap.WithoutPrecision<Uniforms>,
    TypeMap.WithoutPrecision<Attributes>,
    TypeMap.WithoutPrecision<Instances>
> {
    const uValues = TypeMap.values("uniform", uniforms);
    const aValues = TypeMap.values("attribute", {
        ...attributes,
        ...(instances || {}),
    });
    const vValues = varyings ? TypeMap.values("varying", varyings) : {};

    // vertex
    const vertexBuilder = new GlslBuilder();

    Object.keys(vValues).forEach(name => {
        vValues[name].getValue(vertexBuilder);
    });

    const vertexOutput = vertex({
        ...uValues,
        ...aValues,
    } as any);
    const vertexAssignment = Object.keys(vertexOutput)
        .map(name => {
            return `${name} = ${vertexOutput[name].getValue(vertexBuilder).content};\n`;
        })
        .join("");

    const vertexSource =
        vertexBuilder.getGlobal() +
        "void main() {\n" +
        vertexBuilder.getLocal() +
        vertexAssignment +
        "}\n";

    // fragment
    const fragmentBuilder = new GlslBuilder();

    Object.keys(vValues).forEach(name => {
        vValues[name].getValue(vertexBuilder);
    });

    const fragmentOutput = fragment({
        ...uValues,
        ...vValues,
        gl_FragCoord: new Glsl(() => {
            return {
                type: Type.Vector4,
                content: "gl_FragCoord",
            };
        }),
        gl_PointCoord: new Glsl(() => {
            return {
                type: Type.Vector2,
                content: "gl_FragCoord",
            };
        }),
        gl_FrontFacing: new Glsl(() => {
            return {
                type: Type.Boolean,
                content: "gl_FrontFacing",
            };
        }),
    } as any);
    const fragmentColor = fragmentOutput.gl_FragColor.getValue(fragmentBuilder);
    const fragmentSource =
        fragmentBuilder.getGlobal() +
        "void main() {\n" +
        fragmentBuilder.getLocal() +
        `gl_FragColor = ${fragmentColor.content};\n` +
        "}\n";

    // result
    return {
        vertex: vertexSource,
        fragment: fragmentSource,
        uniforms: TypeMap.withoutPrecision(uniforms),
        attributes: TypeMap.withoutPrecision(attributes),
        instances: TypeMap.withoutPrecision(instances || ({} as Instances)),
    };
}

/**
 * Wrap set of values into single GLSL value
 */
export const val = Glsl.val;
