import path from 'node:path'
import { configFilePath } from './config.js'

/**
 * The absolute path to the project directory, where the latexmk-watcher
 * configuration file resides.
 */
export const projectDir = path.dirname(configFilePath)

/**
 * Gets the absolute path to a project file in the project directory.
 */
export function getProjectFilePath(...filePath: string[]): string {
    return path.resolve(projectDir, ...filePath)
}
