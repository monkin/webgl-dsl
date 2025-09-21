import { PixelFormat, TextureFilter, TextureFormat } from "./enums";
import {
    CLAMP_TO_EDGE,
    TEXTURE_2D,
    TEXTURE_MAG_FILTER,
    TEXTURE_MIN_FILTER,
    TEXTURE_WRAP_S,
    TEXTURE_WRAP_T,
    UNPACK_FLIP_Y_WEBGL,
    UNSIGNED_BYTE,
} from "./consts";
import { Gl } from "./webgl";

export type TextureConfig = {
    /**
     * @default TextureFormat.RGBA
     */
    format?: TextureFormat;
    /**
     * @default TextureFilter.NEAREST
     */
    filter?: TextureFilter;
} & (
    | {
          image: TexImageSource;
      }
    | {
          data: ArrayBufferView;
          width: number;
          height: number;
      }
    | {
          width: number;
          height: number;
      }
);

/**
 * 2D texture
 */
export class Texture {
    readonly handle: WebGLTexture;
    readonly width: number;
    readonly height: number;
    readonly format: TextureFormat;
    readonly filter: TextureFilter;

    constructor(
        public readonly gl: Gl,
        config: TextureConfig,
    ) {
        this.handle = gl.handle.createTexture()!;

        this.format = config.format || TextureFormat.Rgba;
        this.filter = config.filter || TextureFilter.Nearest;

        if ("image" in config) {
            this.width =
                config.image instanceof HTMLImageElement
                    ? config.image.naturalWidth
                    : config.image instanceof VideoFrame
                      ? config.image.codedWidth
                      : config.image.width;
            this.height =
                config.image instanceof HTMLImageElement
                    ? config.image.naturalHeight
                    : config.image instanceof VideoFrame
                      ? config.image.codedHeight
                      : config.image.height;
        } else {
            this.width = config.width;
            this.height = config.height;
        }

        gl.settings()
            .activeTexture(0)
            .texture(0, this)
            .apply(() => {
                gl.handle.pixelStorei(UNPACK_FLIP_Y_WEBGL, 1);
                gl.handle.texParameteri(
                    TEXTURE_2D,
                    TEXTURE_MAG_FILTER,
                    this.filter,
                );
                gl.handle.texParameteri(
                    TEXTURE_2D,
                    TEXTURE_MIN_FILTER,
                    this.filter,
                );
                gl.handle.texParameteri(
                    TEXTURE_2D,
                    TEXTURE_WRAP_S,
                    CLAMP_TO_EDGE,
                );
                gl.handle.texParameteri(
                    TEXTURE_2D,
                    TEXTURE_WRAP_T,
                    CLAMP_TO_EDGE,
                );

                if ("image" in config) {
                    gl.handle.texImage2D(
                        TEXTURE_2D,
                        0,
                        this.format,
                        this.format,
                        UNSIGNED_BYTE,
                        config.image,
                    );
                } else {
                    gl.handle.texImage2D(
                        TEXTURE_2D,
                        0,
                        this.format,
                        this.width,
                        this.height,
                        0, // border
                        this.format,
                        UNSIGNED_BYTE,
                        "data" in config ? config.data : null,
                    );
                }
            });
    }

    /**
     * Read pixels from the texture into an array buffer
     */
    read(format: PixelFormat = PixelFormat.Rgba): Uint8Array {
        const bytes = new Uint8Array(
            this.width * this.height * PixelFormat.getChannelsCount(format),
        );

        this.gl
            .settings()
            .renderTarget(this)
            .viewport(0, 0, this.width, this.height)
            .apply(() => {
                this.gl.handle.readPixels(
                    0,
                    0,
                    this.width,
                    this.height,
                    format,
                    UNSIGNED_BYTE,
                    bytes,
                );
            });

        return bytes;
    }

    setFilter(filter: TextureFilter) {
        this.gl.handle.texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, filter);
        this.gl.handle.texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, filter);
    }

    dispose() {
        this.gl.handle.deleteTexture(this.handle);
    }
}