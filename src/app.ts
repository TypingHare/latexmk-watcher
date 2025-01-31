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
import fsExtra from 'fs-extra'
import { getProjectFilePath, projectDir } from './project.js'
import { Watcher } from './watcher.js'

const { ensureDirSync, removeSync } = fsExtra

export const APP_NAME = 'latexmk-watcher'
export const COMMAND_NAME = path.basename(process.argv[1]).trim()
export const VERSION = '0.0.0'

export const program = new Command()

program
    .name(COMMAND_NAME)
    .description('A latexmk watcher that makes latex development smoother.')
    .version(`${APP_NAME} v${VERSION}`, '-v, --version', 'Display the version.')
    .helpOption('-h, --help', 'Display the help information.')

program
    .command('env')
    .description('Display the environment information.')
    .action(async () => {
        console.log(`${chalk.bold(APP_NAME)}: ${VERSION}`)
        console.log(`${chalk.bold('latexmk')}: ${await getLatexmkVersion()}`)

        console.log('-'.repeat(79))
        console.log(`project directory: ${projectDir}`)
        const statusString = existConfigFile() ? '' : ' (Not Created)'
        console.log(`configuration file: ${configFilePath}` + statusString)

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
            watchInterval,
            previewer,
        } = staticConfig
        file = file || defaultFile
        const watchFilePath = getProjectFilePath(sourceDir, file)
        const fullOptions = `${latexmkOptions} -output-directory=${buildDir}`
        const fullCommand = `${latexmkCommand} ${fullOptions} ${watchFilePath}`

        printExecutedCommand(fullCommand)
        spawnShellCommand(fullCommand, projectDir)

        const pdfFileName = path.basename(file, '.tex') + '.pdf'
        const pdfFilePath = getProjectFilePath(sourceDir, buildDir, pdfFileName)
        const openPdfCommand = `open ${pdfFilePath} -a '${previewer}' --background`
        new Watcher(pdfFilePath, watchInterval, openPdfCommand).start()
    })

program
    .command('release')
    .description('Release a PDF.')
    .argument('[<file>]', 'The file to release.')
    .action(async (file: string) => {
        const { sourceDir, buildDir, defaultFile, releaseDir } = staticConfig
        file = file || defaultFile

        const pdfFileName = path.basename(file, '.tex') + '.pdf'
        const pdfFilePath = getProjectFilePath(sourceDir, buildDir, pdfFileName)
        const releaseFilePath = getProjectFilePath(releaseDir, pdfFileName)

        ensureDirSync(path.dirname(releaseFilePath))
        const command = `cp -f ${pdfFilePath} ${releaseFilePath}`
        printExecutedCommand(command)
        await runShellCommand(command)
    })

program
    .command('clean')
    .description('Clean the build directory.')
    .action(async () => {
        const { sourceDir, buildDir } = staticConfig
        removeSync(getProjectFilePath(sourceDir, buildDir))
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
