import { transformFileAsync, types as t, NodePath } from '@babel/core';
import { getCallExpressionName } from './ast';
import fse from 'fs-extra';
import { extendLog } from './log';

const log = extendLog('clean-up');

export async function removeComment(filePath: string, funcName: string) {
    const result = await transformFileAsync(
        filePath,
        {
            filename: filePath,
            plugins: [
                ['@babel/plugin-syntax-typescript', { isTSX: true }],
                '@babel/plugin-syntax-jsx',
                function() {
                    return {
                        name: 'i18n-clean-up',
                        visitor: {
                            CallExpression(path: NodePath<t.CallExpression>) {
                                if (getCallExpressionName(path.node) === funcName) {
                                    path.node.leadingComments = [];
                                }
                            }
                        }
                    }
                }
            ]
        }
    )
    if (result && result.code) {
        log('writing', filePath);
        await fse.outputFile(filePath, result.code, {encoding: 'utf8'});
    }
}