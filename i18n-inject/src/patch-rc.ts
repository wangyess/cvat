import type { I18nItem } from './i18n';
import { types as t, transformFileAsync } from '@babel/core';
import { NodePath } from '@babel/traverse';
import { extendLog } from './log';
import fse from 'fs-extra';

const log = extendLog('patch-rc');

export async function patchFile(
    inFile: string,
    map: Map<I18nItem['id'], I18nItem>,
) {
    const result = await transformFileAsync(
        inFile,
        {
            plugins: [
                ['@babel/plugin-syntax-typescript', { isTSX: true }],
                '@babel/plugin-syntax-jsx',
                function() {
                    return {
                        name: 'i18n-patch-rc',
                        visitor: {
                            CallExpression(path: NodePath<t.CallExpression>) {
                                if (t.isIdentifier(path.node.callee) && path.node.callee.name === 't') {
                                    const { leadingComments } = path.node
                                    if (!leadingComments) {
                                        return
                                    }
                                    const i18nComment = leadingComments.find(
                                        comment => comment.value.startsWith('i18n-')
                                    )
                                    if (!i18nComment) {
                                        return
                                    }
                                    const id = +i18nComment?.value.substr(5);
                                    const i18nItem = map.get(id);
                                    if (!i18nItem) {
                                        return
                                    }
                                    let item = i18nItem;
                                    log({i18nItem})
                                    if (i18nItem && i18nItem.key.startsWith('#SAME_AS_')) {
                                        const targetId = +i18nComment?.value.substr('#SAME_AS_'.length);
                                        const targetItem = map.get(targetId);
                                        if (targetItem) {
                                            item = targetItem;
                                        }
                                    }
                                    const firstArg = path.node.arguments[0];
                                    if (path.node.arguments.length === 1 && t.isStringLiteral(firstArg)) {
                                        const oldKeyOrValue = firstArg.value;
                                        const { key } = item;
                                        if (key === '#RECOVER') {
                                            log('recover', item.id, 'by', firstArg.value)
                                            path.replaceWith(firstArg)
                                        } else if (!key.startsWith('#') && key !== "" && key !== oldKeyOrValue) {
                                            firstArg.value = key;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        }
    );
    if (result && result.code) {
        fse.outputFile(inFile, result.code, 'utf-8')
    }
}