import * as os from 'node:os'
import { PlatformNotSupportedError } from './error.js'

/**
 * Checks if the operating system platform is supported. So far,
 * latexmk-watcher only supports macOS.
 */
export function checkSystem() {
    if (os.platform() !== 'darwin') {
        throw new PlatformNotSupportedError()
    }
}
