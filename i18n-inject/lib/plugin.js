"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transPlugin = void 0;
const core_1 = require("@babel/core");
const ast_1 = require("./ast");
const log_1 = require("./log");
const PLUGIN_NAME = 'i18n-inject';
const log = (0, log_1.extendLog)('ast');
const logCall = log.extend('call');
function transPlugin({ fileName, store, i18n, sets, }) {
    let hasTranslate = false;
    const { JSXInnerText: JSXInnerTextSet, CallExpression: CallExpressionSet, JSXAttribute: JSXAttributeSet, } = sets;
    return {
        name: PLUGIN_NAME,
        visitor: {
            Program: {
                exit(path) {
                    if (hasTranslate) {
                        (0, ast_1.addImportDeclare)(path, i18n);
                    }
                },
            },
            CallExpression(path) {
                const name = (0, ast_1.getCallExpressionName)(path.node);
                if (name && CallExpressionSet.has(name)) {
                    logCall('deal', name);
                    const saveKey = (opt) => {
                        return store.add(Object.assign(Object.assign({}, opt), { file: fileName, tag: `${name}()` }));
                    };
                    // @ts-ignore
                    path.node.arguments = path.node.arguments.map((arg, index) => {
                        if (core_1.types.isStringLiteral(arg)) {
                            hasTranslate = true;
                            logCall(`arg[${index}].loc`, arg.loc);
                            return (0, ast_1.wrapStringLiteral)(arg, i18n.functionName, opt => saveKey(Object.assign(Object.assign({}, opt), (arg.loc ? { loc: arg.loc } : {}))));
                        }
                        if (core_1.types.isObjectExpression(arg)) {
                            hasTranslate = true;
                            const obj = (0, ast_1.wrapObjectStringLiteralProps)(arg, i18n.functionName, opt => saveKey(Object.assign(Object.assign({}, opt), (arg.loc ? { loc: arg.loc } : {}))));
                            // console.log(obj);
                            return obj;
                        }
                        return arg;
                    });
                }
            },
            JSXAttribute(path) {
                const name = (0, ast_1.getJSXElementAndAttrName)(path);
                const saveKey = (opt) => store.add(Object.assign(Object.assign({}, opt), { file: fileName, tag: name, loc: path.node.loc }));
                if (name && JSXAttributeSet.has(name) && core_1.types.isStringLiteral(path.node.value)) {
                    path.node.value = core_1.types.jSXExpressionContainer((0, ast_1.wrapStringLiteral)(path.node.value, i18n.functionName, saveKey));
                }
            },
            JSXElement(path) {
                const tagName = (0, ast_1.getJSXElementName)(path.node.openingElement);
                const { children } = path.node;
                const saveKey = (opt) => store.add(Object.assign(Object.assign({}, opt), { file: fileName, tag: tagName, loc: path.node.loc }));
                if (tagName && JSXInnerTextSet.has(tagName)) {
                    // console.log(children.length, children[0]);
                    if (children.length === 1 && core_1.types.isJSXText(children[0])) {
                        hasTranslate = true;
                        children[0] = core_1.types.jSXExpressionContainer((0, ast_1.wrapStringLiteral)(core_1.types.stringLiteral(children[0].value), i18n.functionName, saveKey));
                    }
                }
            },
        },
    };
}
exports.transPlugin = transPlugin;
