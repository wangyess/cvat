import { PluginObj, NodePath, types as t } from '@babel/core';
import { Store } from './i18n';
import { CliConfigI18n, ConditionSets } from './config';
import {
    addImportDeclare,
    wrapStringLiteral,
    getJSXElementName,
    getCallExpressionName,
    wrapObjectStringLiteralProps, getJSXElementAndAttrName,
} from './ast';
import type { I18nItem } from './i18n';
import { extendLog } from './log';

const PLUGIN_NAME = 'i18n-inject';
const log = extendLog('ast');
const logCall = log.extend('call');

export function transPlugin(
    {
        fileName,
        store,
        i18n,
        sets,
    }: {
        fileName: string,
        store: Store,
        i18n: CliConfigI18n,
        sets: ConditionSets,
    }
): PluginObj {

    let hasTranslate = false;
    const {
        JSXInnerText: JSXInnerTextSet,
        CallExpression: CallExpressionSet,
        JSXAttribute: JSXAttributeSet,
    } = sets;

    return {
        name: PLUGIN_NAME,
        visitor: {
            Program: {
                exit(path: NodePath<t.Program>) {
                    if (hasTranslate) {
                        addImportDeclare(path, i18n);
                    }
                },
            },
            CallExpression(path: NodePath<t.CallExpression>) {
                const name = getCallExpressionName(path.node);
                if (name && CallExpressionSet.has(name)) {
                    logCall('deal', name);
                    const saveKey = (opt: Partial<I18nItem>): I18nItem => {
                        return store.add({
                            ...opt,
                            file: fileName,
                            condition: `${name}()`,
                        } as I18nItem);
                    }
                    // @ts-ignore
                    path.node.arguments = path.node.arguments.map((arg, index) => {
                        if (t.isStringLiteral(arg)) {
                            hasTranslate = true;
                            logCall(`arg[${index}].loc`, arg.loc)
                            return wrapStringLiteral(
                                arg,
                                i18n.functionName,
                                opt => saveKey({
                                    ...opt,
                                    ...(arg.loc ? { loc: arg.loc } : {}),
                                }),
                            );
                        }
                        if (t.isObjectExpression(arg)) {
                            hasTranslate = true;
                            const obj = wrapObjectStringLiteralProps(
                                arg,
                                i18n.functionName,
                                opt => saveKey({
                                    ...opt,
                                    ...(arg.loc ? { loc: arg.loc } : {}),
                                }),
                            );
                            // console.log(obj);
                            return obj;
                        }
                        return arg;
                    });
                }
            },
            JSXAttribute(path: NodePath<t.JSXAttribute>) {
                const name = getJSXElementAndAttrName(path);
                const saveKey = (opt: Partial<I18nItem>) => store.add({
                    ...opt,
                    file: fileName,
                    condition: name,
                    loc: path.node.loc,
                } as I18nItem);
                if (name && JSXAttributeSet.has(name) && t.isStringLiteral(path.node.value)) {
                    path.node.value = t.jSXExpressionContainer(
                        wrapStringLiteral(path.node.value, i18n.functionName, saveKey),
                    );
                }
            },
            JSXElement(path: NodePath<t.JSXElement>) {
                const tagName = getJSXElementName(path.node.openingElement);
                const { children } = path.node;
                const saveKey = (opt: Partial<I18nItem>): I18nItem => store.add({
                    ...opt,
                    file: fileName,
                    condition: tagName,
                    loc: path.node.loc,
                } as I18nItem);
                if (tagName && JSXInnerTextSet.has(tagName)) {
                    // console.log(children.length, children[0]);
                    if (children.length === 1 && t.isJSXText(children[0])) {
                        hasTranslate = true;
                        children[0] = t.jSXExpressionContainer(
                            wrapStringLiteral(
                                t.stringLiteral(children[0].value),
                                i18n.functionName,
                                saveKey,
                            ),
                        );
                    }
                }
            },
        },
    }
}