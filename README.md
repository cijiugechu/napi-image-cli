# napi-image-cli

An efficient cli tool that helps you compress and convert images, powered by [@napi-rs/image](https://github.com/Brooooooklyn/Image).

see [example](./packages/playground/)

## Installation
```shell
npm install napi-image-cli --save-dev
# or you use pnpm 
pnpm add napi-image-cli -D
```

## Usage
in your `package.json`, add following code to `scripts` field:
```json
//...
{
    "image": "napi-image assets --type lossy --quality 75 --mode modern"
}
//...
```
and run:
```shell
npm run image
```

## Options

| flag   |   default   | description   |
| :--    | :--    | :--       |
| --type [type] |   `lossless`  | specify type, `lossy` or `lossless` |
| --quality [quality] |   75  | specify quality, ranges from 0 to 100 and controls the loss and quality during compression |
| --mode [mode] |  `lazy`   | specify mode, `compat` mode means compatibility with browsers that don't support `avif`, i.e. transforming `avif` to `jpg` ; `modern` mode will transform all the formats to `avif`; `lazy` mode will do nothing about format transforming. |
| --outDir [outDir] |  `dist/assets`   |   specify Specify the output directory (relative to project root).

## License

MIT &copy; [nemurubaka](https://github.com/cijiugechu)
