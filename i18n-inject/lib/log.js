"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendLog = exports.BASE_LOG = void 0;
const debug_1 = __importDefault(require("debug"));
exports.BASE_LOG = (0, debug_1.default)('inject-i18n');
function extendLog(ns) {
    return exports.BASE_LOG.extend(ns);
}
exports.extendLog = extendLog;
