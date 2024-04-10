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
exports.removeComment = void 0;
const core_1 = require("@babel/core");
const ast_1 = require("./ast");
const fs_extra_1 = __importDefault(require("fs-extra"));
const log_1 = require("./log");
const log = (0, log_1.extendLog)('clean-up');
function removeComment(filePath, funcName) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield (0, core_1.transformFileAsync)(filePath, {
            filename: filePath,
            plugins: [
                ['@babel/plugin-syntax-typescript', { isTSX: true }],
                '@babel/plugin-syntax-jsx',
                function () {
                    return {
                        name: 'i18n-clean-up',
                        visitor: {
                            CallExpression(path) {
                                if ((0, ast_1.getCallExpressionName)(path.node) === funcName) {
                                    path.node.leadingComments = [];
                                }
                            }
                        }
                    };
                }
            ]
        });
        if (result && result.code) {
            log('writing', filePath);
            yield fs_extra_1.default.outputFile(filePath, result.code, { encoding: 'utf8' });
        }
    });
}
exports.removeComment = removeComment;
