"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
const transform_1 = require("./transform");
const log_1 = require("./log");
const fs_extra_1 = __importDefault(require("fs-extra"));
const i18n_1 = require("./i18n");
// @ts-ignore
const package_json_1 = require("../package.json");
const removeComment_1 = require("./removeComment");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const log = (0, log_1.extendLog)('cli');
function loadRc(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield fs_extra_1.default.pathExists(filePath)) {
            return require(filePath);
        }
        else {
            return [];
        }
    });
}
function loadConfig(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield fs_extra_1.default.pathExists(filePath))) {
            log('config File not found', filePath);
            throw new Error('config file not found');
        }
        return require(filePath);
    });
}
// @see https://github.com/tj/commander.js/blob/HEAD/Readme_zh-CN.md#%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B
commander_1.program
    .name('inject-i18n')
    .requiredOption('-c, --config-file <configFile>', 'config path')
    .description('add i18n translate call in source code')
    .version(package_json_1.version)
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    const CWD = process.cwd();
    log('CWD', CWD, options);
    const configFilePath = path_1.default.join(CWD, options.configFile);
    const configFileDir = path_1.default.dirname(configFilePath);
    const conf = yield loadConfig(configFilePath);
    const i18nStore = new i18n_1.Store();
    log('config', conf, conf.condition);
    const conditionSets = Object.entries(conf.condition || {})
        .reduce((pre, [key, list]) => {
        pre[key] = new Set(list);
        return pre;
    }, {});
    log('sets', conditionSets);
    const srcDir = path_1.default.join(configFileDir, conf.srcDir);
    const destDir = path_1.default.join(configFileDir, conf.destDir);
    log('srcDir', srcDir);
    const g = yield (0, glob_1.glob)(conf.srcPattern, { cwd: srcDir });
    for (const file of g) {
        const inFile = path_1.default.join(srcDir, file);
        const outFile = path_1.default.join(destDir, file);
        log('trans', file, '->', outFile);
        yield (0, transform_1.transformFile)(inFile, file, outFile, conditionSets, conf.i18n, i18nStore);
    }
    const rcRawFile = path_1.default.join(configFileDir, conf.i18n.resourceRawFile);
    log('saving', rcRawFile);
    yield fs_extra_1.default.outputJSON(rcRawFile, i18nStore, { spaces: 2 });
}));
commander_1.program.command('clean-up')
    .description(`remove comment id before translate function

    /* i18n-1 */ t('foo')
        -->
    t('foo')
`)
    .action((_, command) => __awaiter(void 0, void 0, void 0, function* () {
    const CWD = process.cwd();
    const options = command.optsWithGlobals();
    const configFilePath = path_1.default.join(CWD, options.configFile);
    const configFileDir = path_1.default.dirname(configFilePath);
    const conf = yield loadConfig(configFilePath);
    const destDir = path_1.default.join(configFileDir, conf.destDir);
    const g = yield (0, glob_1.glob)(conf.srcPattern, { cwd: destDir });
    for (const file of g) {
        const inFile = path_1.default.join(destDir, file);
        log('deal', file);
        yield (0, removeComment_1.removeComment)(inFile, conf.i18n.functionName);
    }
    log('success');
}));
commander_1.program.command('export-rc')
    .description(`export i18n resource file like i18n/en.json`)
    .action((_, command) => __awaiter(void 0, void 0, void 0, function* () {
    const CWD = process.cwd();
    const options = command.optsWithGlobals();
    log('CWD', CWD, options);
    const configFilePath = path_1.default.join(CWD, options.configFile);
    const configFileDir = path_1.default.dirname(configFilePath);
    const conf = yield loadConfig(configFilePath);
    const rcRawFilePath = path_1.default.join(configFileDir, conf.i18n.resourceRawFile);
    const rcFilePath = path_1.default.join(configFileDir, conf.i18n.resourceFile);
    const { list, lastId } = require(rcRawFilePath);
    const PRE_LINE = '    ';
    const mapStr = list
        .map((_a) => {
        var { key, value } = _a, other = __rest(_a, ["key", "value"]);
        return (Object.assign({ key: key || value, value }, other));
    })
        .reduce((pre, item) => {
        const { key, value } = item;
        const { set, list } = pre;
        if (!set.has(key)) {
            list.push(item);
            set.add(key);
        }
        else {
            log('warning', 'remove same key', `${key} -> ${value}`);
        }
        return pre;
    }, {
        set: new Set(),
        list: [],
    })
        .list
        .map(({ key, value, id }) => {
        return `${PRE_LINE}// id: ${id}\n`
            + `${PRE_LINE}${JSON.stringify(key || value)}: ${JSON.stringify(value)},\n`;
    })
        .join('\n');
    const now = new Date();
    const nowTime = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} `
        + `${now.getHours()}:${now.getMinutes()}`;
    const rcStr = `// lastId: ${lastId}\n`
        + `// createAt: ${nowTime}\n`
        + `export default {\n${mapStr}\n}`;
    yield fs_extra_1.default.outputFile(rcFilePath, rcStr, 'utf-8');
    log('success', rcFilePath);
}));
commander_1.program.parseAsync();
