import { toMatchImageSnapshot } from "jest-image-snapshot";

expect.extend({ toMatchImageSnapshot });

expect.extend({
    toMatchTextureSnapshot: function () {},
});
