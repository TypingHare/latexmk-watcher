import { existsSync, statSync } from 'node:fs'
import { printExecutedCommand, runShellCommand } from './shell.js'

/**
 * A simple PDF watcher.
 */
export class Watcher {
    private lastUpdatedTime: number = Date.now()

    public constructor(
        readonly pdfFile: string,
        readonly interval: number,
        readonly openCommand: string
    ) {}

    public start() {
        setInterval(() => {
            if (!existsSync(this.pdfFile)) {
                return
            }

            const lastUpdatedTime = statSync(this.pdfFile).mtime.getTime()
            if (lastUpdatedTime > this.lastUpdatedTime) {
                this.runCommand()
                this.lastUpdatedTime = lastUpdatedTime
            }
        }, this.interval)
    }

    private runCommand(): void {
        printExecutedCommand(this.openCommand)
        runShellCommand(this.openCommand).then()
    }
}
