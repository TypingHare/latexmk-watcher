import { promisify } from 'util'
import { exec, spawn } from 'node:child_process'
import chalk from 'chalk'

export interface ShellCommandResult {
    stdout: string
    stderr: string
    exitCode: number
}

export async function runShellCommand(
    command: string
): Promise<ShellCommandResult> {
    try {
        const { stdout, stderr } = await promisify(exec)(command)
        return { stdout, stderr, exitCode: 0 }
    } catch (error: any) {
        return {
            stdout: error.stdout ?? '',
            stderr: error.stderr ?? error.message ?? 'Unknown error',
            exitCode: error.code ?? 1,
        }
    }
}

export function spawnShellCommand(
    command: string,
    cwd: string = process.cwd()
): void {
    const childProcess = spawn(command, [], {
        shell: true,
        detached: false,
        cwd: cwd,
    })

    childProcess.stdout.on('data', (data) => {
        process.stdout.write(data)
    })

    childProcess.stderr.on('data', (data) => {
        process.stderr.write(data)
    })

    // Handle errors
    childProcess.on('error', (error) => {
        console.error(`Failed to start subprocess: ${error}`)
    })
}

export function printExecutedCommand(command: string) {
    console.log('Executing shell command: ' + chalk.yellow(command))
}
