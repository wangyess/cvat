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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformFile = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const core_1 = require("@babel/core");
const log_1 = require("./log");
const plugin_1 = require("./plugin");
const log = (0, log_1.extendLog)('transform');
const logSuc = log.extend('success');
const PLUGIN_NAME = 'i18n-inject';
function transformFile(srcPath, fileName, outPath, sets, i18n, store) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = yield fs_extra_1.default.readFile(srcPath, { encoding: 'utf8' });
        log('reading', srcPath);
        const result = yield (0, core_1.transformFileAsync)(srcPath, {
            filename: fileName,
            plugins: [
                ['@babel/plugin-syntax-typescript', { isTSX: true }],
                '@babel/plugin-syntax-jsx',
                (0, plugin_1.transPlugin)({
                    fileName,
                    store,
                    i18n,
                    sets,
                }),
            ]
        });
        if (result && result.code) {
            logSuc('writing', outPath);
            yield fs_extra_1.default.outputFile(outPath, result.code, { encoding: 'utf8' });
        }
    });
}
exports.transformFile = transformFile;
