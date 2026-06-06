import { Glsl, GlslBuilder, Type } from "./dsl";

describe("DSL memoization", () => {
    it("walks a memoized operand once no matter how often it is referenced", () => {
        // A leaf that counts how many times it is traversed.
        let walks = 0;
        const leaf = new Glsl<Type.Scalar>(() => {
            walks++;
            return { type: Type.Scalar, content: "1.0" };
        });

        // Build a doubling chain: each level memoizes the previous node and
        // references it twice. Without memoizing the traversal (walk inside
        // `once`), the leaf would be walked 2^depth times — exponential.
        let node: Glsl.Scalar = leaf;
        for (let i = 0; i < 20; i++) {
            const memo = node.memHQ();
            node = memo.add(memo);
        }
        node.getValue(new GlslBuilder());

        expect(walks).toBe(1);
    });

    it("emits the memoized local exactly once in the generated source", () => {
        const leaf = new Glsl<Type.Scalar>(() => ({
            type: Type.Scalar,
            content: "1.0",
        }));
        const memo = leaf.add(2).memHQ();
        // Reference the same memoized node several times.
        const builder = new GlslBuilder();
        memo.add(memo).add(memo).getValue(builder);

        const declarations = builder.getLocal().match(/highp float mem\d+ =/g);
        expect(declarations).toHaveLength(1);
    });
});
