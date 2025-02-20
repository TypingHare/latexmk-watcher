import chalk from 'chalk'
import process from 'node:process'

/**
 * Displays the error message and exits the program.
 * @param error The error caught by the program.
 * @param exitCode The exit code of the program.
 */
export function displayErrorMessageAndExit(
    error: unknown,
    exitCode: number = 1
) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(chalk.red(errorMessage))
    process.exit(exitCode)
}

export class PlatformNotSupportedError extends Error {
    public constructor() {
        super(
            'Latexmk-watcher now only supports macOS. If you are willing to ' +
                'contribute to this application, please visit\n\n    ' +
                'https://github.com/TypingHare/latexmk-watcher'
        )
    }
}
