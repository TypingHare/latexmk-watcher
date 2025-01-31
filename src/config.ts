import path from 'node:path'
import { ensureDirSync } from 'fs-extra'
import { existsSync, writeFileSync } from 'node:fs'
import { readFileSync } from 'fs'

/**
 * The name of the configuration file, which marks the directory as a
 * latexmk-watcher root directory.
 */
export const CONFIG_NAME = 'latexmk-watcher.config.json'

export interface Config {
    // The source directory
    sourceDir: string

    // The build directory
    buildDir: string

    // The default file that is used when the <file> argument is omitted
    defaultFile: string

    // The latexmk command
    latexmkCommand: string

    // The latexmk options
    latexmkOptions: string

    // The previewer (an application name)
    previewer: string

    // The release directory
    releaseDir: string
}

/**
 * The default configuration.
 */
export const defaultConfig: Config = {
    sourceDir: 'src',
    buildDir: 'build',
    defaultFile: 'main.tex',
    latexmkCommand: 'latexmk',
    latexmkOptions: '-pdf -xelatex -cd',
    previewer: 'Safari',
    releaseDir: 'release',
}

/**
 * The absolute path to the configuration file. Searches up from the current
 * working directory until a config is found, or defaults to the current
 * working directory.
 */
export const configFilePath = (function () {
    let dirPath = process.cwd()
    while (dirPath.length > 1) {
        const configFilePath = path.resolve(dirPath, CONFIG_NAME)
        if (existsSync(configFilePath)) {
            return configFilePath
        }

        dirPath = path.dirname(dirPath).trim()
    }

    return path.resolve(process.cwd(), CONFIG_NAME)
})()

export const projectDir = path.dirname(configFilePath)

export function existConfigFile(): boolean {
    return existsSync(configFilePath)
}

export function readConfig(): Config {
    return existsSync(configFilePath)
        ? JSON.parse(readFileSync(configFilePath, 'utf8'))
        : defaultConfig
}

export function writeConfig(config: Config): void {
    ensureDirSync(path.dirname(configFilePath))
    writeFileSync(configFilePath, JSON.stringify(config, null, 2))
}

export function updateConfig(updater: (config: Config) => Config | void): void {
    const currentConfig = readConfig()
    const updatedConfig = updater(currentConfig)

    if (updatedConfig != null) {
        writeConfig(updatedConfig)
    }
}
