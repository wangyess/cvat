import { program } from 'commander';
import path from 'path';
import { glob } from 'glob';
import { transformFile } from './transform';
import { extendLog } from './log';
import fse from 'fs-extra';
import { I18nItem, Store, RcRaw } from './i18n';
// @ts-ignore
import { version } from '../package.json';
import { CliConfig, ConditionKeys, ConditionSets } from './config';
import { removeComment } from './removeComment';
import { patchFile } from './patch-rc';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const log = extendLog('cli');

async function loadRc(filePath: string) {
    if (await fse.pathExists(filePath)) {
        return require(filePath) as I18nItem[]
    } else {
        return []
    }
}

async function loadConfig(filePath: string) {

    if (!await fse.pathExists(filePath)) {
        log('config File not found', filePath);
        throw new Error('config file not found');
    }
    return require(filePath) as CliConfig;
}

// @see https://github.com/tj/commander.js/blob/HEAD/Readme_zh-CN.md#%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B
program
    .name('inject-i18n')
    .requiredOption(
        '-c, --config-file <configFile>',
        'config path',
    )
    .description('add i18n translate call in source code')
    .version(version)
    .action(async (options) => {
        const CWD = process.cwd();
        log('CWD', CWD, options);
        const configFilePath = path.join(CWD, options.configFile);
        const configFileDir = path.dirname(configFilePath);

        const conf = await loadConfig(configFilePath);
        const i18nStore = new Store();
        log('config', conf, conf.condition);

        const conditionSets = Object.entries(conf.condition || {})
            .reduce(
                (pre, [key, list]) => {
                    pre[key as unknown as ConditionKeys] = new Set(list)
                    return pre;
                },
                {} as ConditionSets
            )
        log('sets', conditionSets);
        const srcDir = path.join(configFileDir, conf.srcDir);
        const destDir = path.join(configFileDir, conf.destDir);
        log('srcDir', srcDir);
        const g = await glob(
            conf.srcPattern,
            { cwd: srcDir }
        )
        for(const file of g) {
            const inFile = path.join(srcDir, file);
            const outFile = path.join(destDir, file);
            log('trans', file, '->', outFile);
            await transformFile(
                inFile,
                file,
                outFile,
                conditionSets,
                conf.i18n,
                i18nStore,
            )
        }
        const rcRawFile = path.join(configFileDir, conf.i18n.resourceRawFile);
        log('saving', rcRawFile);
        await fse.outputJSON(rcRawFile, i18nStore, { spaces: 2 });
    })

program.command('clean-up')
    .description(`remove comment id before translate function

    /* i18n-1 */ t('foo')
        -->
    t('foo')
`
    )
    .action(
        async (_, command) => {
            const CWD = process.cwd();
            const options = command.optsWithGlobals();
            const configFilePath = path.join(CWD, options.configFile);
            const configFileDir = path.dirname(configFilePath);
            const conf = await loadConfig(configFilePath);
            const destDir = path.join(configFileDir, conf.destDir);
            const g = await glob(
                conf.srcPattern,
                { cwd: destDir }
            )
            for(const file of g) {
                const inFile = path.join(destDir, file);
                log('deal', file);
                await removeComment(inFile, conf.i18n.functionName);
            }
            log('success');
        }
    )

program.command('export-rc')
    .description(`export i18n resource file like i18n/en.json`
    )
    .action(
        async (_, command) => {
            const CWD = process.cwd();
            const options = command.optsWithGlobals();
            log('CWD', CWD, options);

            const configFilePath = path.join(CWD, options.configFile);
            const configFileDir = path.dirname(configFilePath);

            const conf = await loadConfig(configFilePath);

            const rcRawFilePath = path.join(configFileDir, conf.i18n.resourceRawFile);

            const { list, lastId } = require(rcRawFilePath) as RcRaw;
            const PRE_LINE = '    ';
            const uniqList = list
                .map(({key, value, ...other}) => ({
                    key: key || value,
                    value,
                    ...other,
                }))
                .reduce((pre, item) => {
                    const { key, value } = item;
                    const { set, list } = pre;
                    if (!set.has(key)) {
                        list.push(item);
                        set.add(key);
                    } else {
                        log('warning', 'remove same key', `${key} -> ${value}`)
                    }
                    return pre;
                }, {
                    set: new Set<string>(),
                    list: [] as I18nItem[],
                })
                .list;
            const now = new Date();
            const nowTime = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} `
                + `${now.getHours()}:${now.getMinutes()}`
            const headerStr = `// lastId: ${lastId}\n`
                + `// createAt: ${nowTime}\n`
            const rcList: Array<{
                rcFileType: keyof CliConfig['i18n'],
                prop: keyof I18nItem,
            }> = [
                {
                    rcFileType: 'resourceFile',
                    prop: 'value'
                },
                {
                    rcFileType: 'resourceCNFile',
                    prop: 'cnValue'
                },
            ];

            await Promise.all(
                 rcList
                    .map(async ({rcFileType, prop}) => {
                        const rcFilePath = path.join(configFileDir, conf.i18n[rcFileType]);
                        log('gen', rcFilePath);
                        const mapStr = uniqList
                            .map((item) => {
                                const { key, value, id } = item;
                                return `${PRE_LINE}// id: ${id}\n`
                                    + `${PRE_LINE}${JSON.stringify(key || value)}: ${JSON.stringify(item[prop] || value)},\n`
                            })
                            .join('\n')
                        const rcStr = headerStr
                            + `export default {\n${mapStr}\n}`

                        return await fse.outputFile(rcFilePath, rcStr, 'utf-8');
                    })
            )

            log('success');
        }
    )


program.command('patch-rc')
    .description(`update code in destDir, applying changes
    1. link same key
    2. recover inject
    `)
    .action(async (_, command) => {
        const CWD = process.cwd();
        const options = command.optsWithGlobals();
        log('CWD', CWD, options);

        const configFilePath = path.join(CWD, options.configFile);
        const configFileDir = path.dirname(configFilePath);

        const conf = await loadConfig(configFilePath);

        const rcRawFilePath = path.join(configFileDir, conf.i18n.resourceRawFile);
        const { list } = require(rcRawFilePath) as RcRaw;
        // id -> item
        const rcIdMap = new Map(
            list.map(item => {
                return [item.id, item]
            })
        )
        const rcUniqMap = new Map(
            list.map(item => {
                const { id , key, loc, ...other } = item;
                const SAME_PREFIX = '#SAME_AS_'
                if (key.startsWith(SAME_PREFIX)) {
                    const targetId = + key.substr(SAME_PREFIX.length);
                    log('same id', id, '->', targetId);
                }
                return [id, item];
            })
        )
        const destDir = path.join(configFileDir, conf.destDir);
        const g = await glob(
            conf.srcPattern,
            { cwd: destDir }
        )
        for(const file of g) {
            const inFile = path.join(destDir, file);
            log('deal', file);
            await patchFile(
                inFile,
                rcIdMap,
            )
        }
        log('success');
    })
program.parseAsync();
