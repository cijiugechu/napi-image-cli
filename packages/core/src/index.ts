import { readdir, readFile, writeFile, access, mkdir } from 'fs/promises'
import { constants } from 'fs'
import { resolve } from 'path'
import { cwd } from 'process'
import {
  Transformer,
  compressJpeg,
  losslessCompressPng,
  pngQuantize,
} from '@napi-rs/image'
import type { Config } from './type'

type SupportedExt = 'jpg' | 'png' | 'avif' | 'webp'

const pkgRoot = cwd()

const supportedExt = ['jpg', 'jpeg', 'png', 'avif', 'webp']

const isSupportedExt = (ext: string) => {
  return supportedExt.some(s => ext.endsWith(s))
}

const getExt = (filename: string) => {
  const ext = filename.split('.').at(-1)

  return ext === 'jpeg' ? 'jpg' : (ext as SupportedExt)
}

const readEntry = async (entry: string) => {
  const filenames = await readdir(resolve(pkgRoot, entry))

  const supportedFilenames = filenames.filter(f => isSupportedExt(f))

  const originOptions = supportedFilenames.map(filename => {
    return {
      originEntry: entry,
      originPath: resolve(pkgRoot, entry, filename),
      filename,
    }
  })

  const inputOptions = await Promise.all(
    originOptions.map(async opts => {
      const source = await readFile(opts.originPath)

      return {
        ...opts,
        source,
      }
    })
  )

  return inputOptions
}

const readEntryList = async (entryList: string[]) => {
  const resolved = await Promise.all(
    entryList.map(async entry => {
      const options = await readEntry(entry)

      return {
        entry,
        options,
      }
    })
  )

  return resolved
}

type transOptions = {
  buf: Buffer
  needTrans?: boolean
  quality?: number
}

const napiMap = {
  jpg: {
    lossless: ({ buf, needTrans }: transOptions) => {
      if (needTrans) {
        return new Transformer(buf).jpeg(87)
      }
      return compressJpeg(buf)
    },
    lossy: ({ buf, needTrans, quality }: transOptions) => {
      if (needTrans) {
        return new Transformer(buf).jpeg(quality)
      }
      return compressJpeg(buf, { quality })
    },
  },

  png: {
    lossless: ({ buf }: transOptions) => losslessCompressPng(buf),
    lossy: ({ buf, quality }: transOptions) =>
      pngQuantize(buf, { maxQuality: quality }),
  },

  webp: {
    lossless: ({ buf }: transOptions) => new Transformer(buf).webpLossless(),
    lossy: ({ buf, quality }: transOptions) =>
      new Transformer(buf).webp(quality),
  },

  avif: {
    lossless: ({ buf }: transOptions) =>
      new Transformer(buf).avif({ quality: 100 }),
    lossy: ({ buf, quality }: transOptions) =>
      new Transformer(buf).avif({ quality }),
  },
}

const transformImage = async (
  source: Buffer,
  filename: string,
  type?: 'lossy' | 'lossless',
  quality?: number,
  mode?: 'modern' | 'lazy' | 'compat'
) => {
  const ext = getExt(filename)
  const compType = type ?? 'lossless'

  if (mode === 'compat') {
    const outputBuffer = await napiMap['jpg'][compType]({
      buf: source,
      needTrans: true,
      quality,
    })

    return {
      filename: filename.replace(ext, 'jpg'),
      outputBuffer,
    }
  } else if (mode === 'modern') {
    const outputBuffer = await napiMap['avif'][compType]({
      buf: source,
      quality,
    })

    return {
      filename: filename.replace(ext, 'avif'),
      outputBuffer,
    }
  } else {
    const outputBuffer = await napiMap[ext][compType]({
      buf: source,
      quality,
    })

    return {
      filename,
      outputBuffer,
    }
  }
}

type EntryListResult = Awaited<ReturnType<typeof readEntryList>>

const transformEntryListResult = async (
  result: EntryListResult,
  type: any,
  quality: any,
  mode: any
) => {
  const transformed = await Promise.all(
    result.map(async ent => {
      const outputList = await Promise.all(
        ent.options.map(async file => {
          const img = await transformImage(
            file.source,
            file.filename,
            type,
            quality,
            mode
          )

          return {
            ...img,
            originalPath: file.originPath,
            originalEntry: file.originEntry,
          }
        })
      )

      return {
        entry: ent.entry,
        outputList,
      }
    })
  )

  return transformed
}

const writeSingleOutput = async (
  outDir: string,
  entry: string,
  buf: Buffer,
  filename: string
) => {
  await writeFile(resolve(pkgRoot, outDir, entry, filename), buf)
}

const ensureDir = async (dir: string) => {
  try {
    await access(dir, constants.F_OK)
  } catch (e: unknown) {
    await mkdir(dir, { recursive: true })
  }
}

const main = async (config: Config) => {
  const {
    entry,
    type = 'lossless',
    outDir = 'dist/assets',
    quality = 75,
    mode = 'lazy',
  } = config

  if (entry.length === 0) {
    return
  }

  const entryListResult = await readEntryList(entry)

  const transformed = await transformEntryListResult(
    entryListResult,
    type,
    quality,
    mode
  )

  const absoluteOutDir = resolve(pkgRoot, outDir)

  await ensureDir(absoluteOutDir)

  await Promise.all(
    transformed.map(async ent => {
      await ensureDir(resolve(pkgRoot, outDir, ent.entry))

      await Promise.all(
        ent.outputList.map(async li => {
          await writeSingleOutput(
            outDir,
            ent.entry,
            li.outputBuffer,
            li.filename
          )
        })
      )
    })
  )
}

export { main }
