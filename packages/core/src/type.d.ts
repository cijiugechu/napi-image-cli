type Config = {
  entry: string[]
  /**
   * @default 'dist/assets'
   */
  outDir?: string
  /**
   * @default 'lossless'
   */
  type?: 'lossless' | 'lossy'
  /**
   * @default 75
   */
  quality?: number
  /**
   * @default 'lazy'
   *
   * @description `compat` mode means compatibility with browsers that don't
   * support `avif`, i.e. transforming `avif` to `jpg` ;
   *
   * `modern` mode will transform all the formats to `avif`;
   *
   * `lazy` mode will do nothing about format transforming.
   */
  mode?: 'compat' | 'modern' | 'lazy'
}

export type { Config }
