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
    // The source directory, in which all tex files should be placed
    sourceDir: string

    // The build directory. This directory is regarded as the "output directory"
    // for latexmk. It should be added to .gitignore, as all files in it are
    // temporary files
    buildDir: string

    // The default file that is used when the <file> argument is omitted
    defaultFile: string

    // The latexmk command
    latexmkCommand: string

    // The latexmk options. It is a string that will be concatenated to a full
    // command in the `watch` command
    latexmkOptions: string

    // The watch interval in milliseconds
    watchInterval: number

    // The previewer (an application name)
    previewer: string

    // The release directory that is used in the `release` command
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
    watchInterval: 1000,
    previewer: 'Google Chrome',
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

/**
 * The static configuration. It is updated whenever the configuration is
 * persisted.
 */
export const staticConfig: Config = loadConfig()

/**
 * Checks if the configuration file exists.
 */
export function existConfigFile(): boolean {
    return existsSync(configFilePath)
}

/**
 * Loads configuration from the configuration file. If the configuration file
 * does not exist, returns the default configuration.
 */
export function loadConfig(): Config {
    return existsSync(configFilePath)
        ? JSON.parse(readFileSync(configFilePath, 'utf8'))
        : defaultConfig
}

/**
 * Saves configuration to the configuration file.
 */
export function saveConfig(config: Config): void {
    ensureDirSync(path.dirname(configFilePath))
    writeFileSync(configFilePath, JSON.stringify(config, null, 2))

    // Update the static configuration
    Object.assign(staticConfig, config)
}

/**
 * Loads configuration from the configuration file, and passes it to the
 * `updater`.
 *
 * @param updater If the updater function returns a `Config` object, the
 * returned object will be saved to the configuration file.
 */
export function updateConfig(updater: (config: Config) => Config | void): void {
    const currentConfig = loadConfig()
    const updatedConfig = updater(currentConfig)

    if (updatedConfig != null) {
        saveConfig(updatedConfig)
    }
}
