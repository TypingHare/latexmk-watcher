import { Command } from 'commander'
import {
    getLatexmkVersion,
    getPdfFilePath,
    latexmkInstalled,
} from './latexmk.js'
import {
    configFilePath,
    defaultConfig,
    existConfigFile,
    projectDir,
    readConfig,
    updateConfig,
} from './config.js'
import chalk from 'chalk'
import process from 'node:process'
import path from 'node:path'
import { runShellCommand, spawnShellCommand } from './shell.js'

export const APP_NAME = 'latexmk-watcher'
export const VERSION = '0.0.0'

export const program = new Command()

program
    .name(APP_NAME)
    .description('A latexmk watcher that makes latex development smoother.')
    .version(VERSION, '-v, --version', 'Display the version.')
    .helpOption('-h, --help', 'Display the help information.')

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
    .command('env')
    .description('Display the environment information.')
    .action(async () => {
        console.log(`${chalk.bold(APP_NAME)}: ${VERSION}`)
        console.log(`${chalk.bold('latexmk')}: ${await getLatexmkVersion()}`)
        console.log('-'.repeat(79))
        console.log(`project directory: ${projectDir}`)
    })

program
    .command('watch')
    .description('Watches a tex file.')
    .argument('<file>', 'The tex file to watch.')
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

        const { sourceDir, buildDir, latexmkCommand, latexmkOptions } =
            readConfig()
        const watchFilePath = path.resolve(projectDir, sourceDir, file)
        const fullOptions = `${latexmkOptions} -output-directory=${buildDir}`
        const command = `${latexmkCommand} ${fullOptions} ${watchFilePath}`

        console.log(chalk.green(command))
        spawnShellCommand(command, projectDir)
    })

program
    .command('release')
    .description('Releases a file.')
    .argument('[<file>]', 'The file to release.', '')
    .action(async (file: string) => {
        const { releaseDir, defaultFile } = readConfig()
        file = file || defaultFile

        const pdfFilePath = getPdfFilePath()
        const releaseFilePath = path.resolve(
            releaseDir,
            path.basename(file, '.tex') + '.pdf'
        )
        const command = `cp -f ${pdfFilePath} ${releaseFilePath}`
        console.log(chalk.green(command))
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
