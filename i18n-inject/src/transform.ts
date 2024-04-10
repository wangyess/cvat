import fse from 'fs-extra';
import { PluginObj, transformFileAsync } from '@babel/core';
import { extendLog } from './log';
import { CliConfigI18n, ConditionSets } from './config';
import { Store } from './i18n';
import {
    transPlugin
} from './plugin';

const log = extendLog('transform');
const logSuc = log.extend('success');

const PLUGIN_NAME = 'i18n-inject';

export async function transformFile(
    srcPath: string,
    fileName: string,
    outPath: string,
    sets: ConditionSets,
    i18n: CliConfigI18n,
    store: Store,
) {
    const content = await fse.readFile(srcPath, { encoding: 'utf8' });
    log('reading', srcPath);
    const result = await transformFileAsync(
        srcPath,
        {
            filename: fileName,
            plugins: [
                ['@babel/plugin-syntax-typescript', { isTSX: true }],
                '@babel/plugin-syntax-jsx',
                transPlugin({
                    fileName,
                    store,
                    i18n,
                    sets,
                }),
            ]
        })
    if (result && result.code) {
        logSuc('writing', outPath);
        await fse.outputFile(outPath, result.code, {encoding: 'utf8'});
    }
}
