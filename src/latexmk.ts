import { runShellCommand } from './shell.js'
import { getProjectFilePath } from './project.js'
import fsExtra from 'fs-extra'

const { remove } = fsExtra

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
 * Removes the build directory.
 * @param sourceDir The path to the source directory.
 * @param buildDir The name of the build directory.
 */
export async function removeBuildDir(
    sourceDir: string,
    buildDir: string
): Promise<string> {
    const buildDirPath = getProjectFilePath(sourceDir, buildDir)
    await remove(buildDirPath)

    return buildDirPath
}
