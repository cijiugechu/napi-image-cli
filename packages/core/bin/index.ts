#!/usr/bin/env node

import minimist from 'minimist'
import { main } from '../src'
import type { Config } from '../src/type'

const arglist = process.argv.slice(2)

const args = minimist(arglist)

const parseArgs = (args: minimist.ParsedArgs) => {
  const { _: entry } = args

  return {
    ...args,
    entry,
  } as Config
}

main(parseArgs(args))
