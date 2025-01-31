import { Command } from 'commander'
import { getLatexmkVersion, latexmkInstalled } from './latexmk.js'
import {
    configFilePath,
    defaultConfig,
    existConfigFile,
    staticConfig,
    updateConfig,
} from './config.js'
import chalk from 'chalk'
import process from 'node:process'
import path from 'node:path'
import {
    printExecutedCommand,
    runShellCommand,
    spawnShellCommand,
} from './shell.js'
import { ensureDirSync } from 'fs-extra'
import { getProjectFile, projectDir } from './project.js'

export const APP_NAME = 'latexmk-watcher'
export const VERSION = '0.0.0'

export const program = new Command()

program
    .name(APP_NAME)
    .description('A latexmk watcher that makes latex development smoother.')
    .version(VERSION, '-v, --version', 'Display the version.')
    .helpOption('-h, --help', 'Display the help information.')

program
    .command('env')
    .description('Display the environment information.')
    .action(async () => {
        console.log(`${chalk.bold(APP_NAME)}: ${VERSION}`)
        console.log(`${chalk.bold('latexmk')}: ${await getLatexmkVersion()}`)

        console.log('-'.repeat(79))
        console.log(`project directory: ${projectDir}`)

        console.log('-'.repeat(79))
        console.log(staticConfig)
    })

program
    .command('init')
    .description(
        'Initialize a configuration file in the current working directory.'
    )
    .option(
        '-f, --force',
        'Write the default configuration even if the configuration file already exists.'
    )
    .action(async (options: { force: boolean }) => {
        if (existConfigFile() && !options.force) {
            throw new Error(
                `Configuration file already exists: ${configFilePath}`
            )
        }

        updateConfig(() => defaultConfig)
        console.log(`Created configuration file: ${configFilePath}`)
    })

program
    .command('watch')
    .description('Watch a tex file.')
    .argument('[<file>]', 'The tex file to watch.')
    .action(async (file: string) => {
        if (!existConfigFile()) {
            throw new Error(
                'Configuration file not found. Please configure your project ' +
                    'directory using the `init` command.\n' +
                    'Pass the --force option to recreate a configuration file.'
            )
        }

        if (!(await latexmkInstalled())) {
            throw new Error('Latexmk is not installed.')
        }

        const {
            sourceDir,
            buildDir,
            defaultFile,
            latexmkCommand,
            latexmkOptions,
        } = staticConfig
        file = file || defaultFile
        const watchFilePath = getProjectFile(sourceDir, file)
        const fullOptions = `${latexmkOptions} -output-directory=${buildDir}`
        const fullCommand = `${latexmkCommand} ${fullOptions} ${watchFilePath}`

        printExecutedCommand(fullCommand)
        spawnShellCommand(fullCommand, projectDir)
    })

program
    .command('release')
    .description('Release a PDF.')
    .argument('[<file>]', 'The file to release.')
    .action(async (file: string) => {
        const { sourceDir, buildDir, releaseDir, defaultFile } = staticConfig
        file = file || defaultFile

        const pdfFileName = path.basename(file, '.tex') + '.pdf'
        const pdfFilePath = getProjectFile(sourceDir, buildDir, pdfFileName)
        const releaseFilePath = getProjectFile(releaseDir, pdfFileName)

        ensureDirSync(path.dirname(releaseFilePath))
        const command = `cp -f ${pdfFilePath} ${releaseFilePath}`
        printExecutedCommand(command)
        await runShellCommand(command)
    })

export function run(program: Command, argv: string[]) {
    program.exitOverride()
    process.on('uncaughtException', (error: unknown) => {
        // Don't treat help or version displays as errors
        if (
            error instanceof Error &&
            [
                'commander.helpDisplayed',
                'commander.version',
                'commander.help',
            ].includes((error as any).code)
        ) {
            process.exit(0)
        }

        const errorMessage =
            error instanceof Error ? error.message : String(error)
        console.error(chalk.red(errorMessage))
        process.exit(1)
    })

    program.parse(argv)
}
