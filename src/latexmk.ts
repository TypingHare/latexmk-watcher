import { runShellCommand } from './shell.js'
import path from 'node:path'
import { readConfig } from './config.js'

/**
 * Retrieves the version of latexmk. Returns `(Not Installed)` if the exit code
 * of the shell command `latexmk --version` is not 0.
 */
export async function getLatexmkVersion(): Promise<string> {
    const { stdout, exitCode } = await runShellCommand('latexmk --version')
    if (exitCode !== 0) {
        return '(Not Installed)'
    }

    const matches = stdout.match(/Version\s+(\d+\.\d+)/)
    return matches ? matches[1] : stdout
}

/**
 * Checks if latexmk is installed.
 */
export async function latexmkInstalled(): Promise<boolean> {
    const { exitCode } = await runShellCommand('latexmk --version')
    return exitCode === 0
}

/**
 * Retrieves the path to the generated PDF file.
 */
export function getPdfFilePath(): string {
    const { buildDir } = readConfig()
    return path.resolve(buildDir)
}
