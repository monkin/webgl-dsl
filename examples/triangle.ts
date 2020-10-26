import { Gl } from "../src";

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const width = canvas.width = canvas.clientWidth * devicePixelRatio;
    const height = canvas.height = canvas.clientHeight * devicePixelRatio;

    const gl = new Gl(canvas);
    const x = gl.settings().viewport(0, 0, width, height);
});
