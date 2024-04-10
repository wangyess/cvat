import { types as t } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { CliConfigI18n } from './config';
import type { I18nItem } from './i18n'

type SaveKeyFn = (item: Partial<I18nItem>) => I18nItem;

const defaultSaveKeyFn = () => ({
    key: '',
    value: '',
    file: 'unknown',
    condition: 'unknown',
    id: -1,
    tag: 'default',
});

export function getCallExpressionName(call: t.CallExpression): string {
    const { callee } = call;
    if (t.isMemberExpression(callee)) {
        const { object, property } = callee;
        if (t.isIdentifier(object) && t.isIdentifier(property)) {
            return `${object.name}.${property.name}`;
        }
    }
    if (t.isIdentifier(callee)) {
        return callee.name;
    }
    return '';
}

export function getJSXElementAndAttrName(path: NodePath<t.JSXAttribute>): string {
    const element = path.parent as t.JSXOpeningElement;
    const attr = path.node;
    const elementName = t.isJSXIdentifier(element.name) ? element.name.name : '';
    if (t.isStringLiteral(attr.value)) {
        return `${elementName}[${attr.name.name}]`;
    }
    return '';
}

export function getJSXElementName(node: t.JSXOpeningElement): string {
    const tag = node.name;
    if (t.isJSXIdentifier(tag)) {
        console.log('tag', tag.name);
        return tag.name;
    }
    if (t.isJSXMemberExpression(tag)) {
        const object = tag.object as t.JSXIdentifier;
        const property = tag.property as t.JSXIdentifier;
        return `${object.name}.${property.name}`;
    }
    return '';
}
export function warpCallExpression(
    funcName: string,
    key: string,
    variable: t.ObjectExpression | undefined = undefined,
) {
    const func = t.identifier(funcName);
    const tmpl = t.stringLiteral(key);
    const args: t.Expression[] = [tmpl];
    if (variable) {
        args.push(variable);
    }
    const call = t.callExpression(
        func,
        args,
    );
    if (!call.extra) {
        call.extra = {};
    }
    call.extra.injected = true;
    return call;
}


export function wrapStringLiteral(
    node: t.StringLiteral,
    funcName: string,
    saveKey: SaveKeyFn = defaultSaveKeyFn,
): t.CallExpression {
    const { id } = saveKey({
        key: '',
        value: node.value as string,
    });
    const call = warpCallExpression(funcName, node.value);
    t.addComment(call, 'leading', `i18n-${id}`);
    return call;
}

export function wrapTemplateLiteral(
    node: t.TemplateLiteral,
    funcName: string,
    saveKey: SaveKeyFn = defaultSaveKeyFn,
): t.CallExpression | null {
    const { quasis, expressions } = node;
    // TODO support callExpression `${x()}`
    if (!expressions.every((exp) => t.isIdentifier(exp))) {
        return null;
    }
    const quasisList = quasis.map((qu) => ({
        start: qu.start as number,
        str: qu.value.cooked as string,
    }));
    const expressionProps: t.ObjectProperty[] = [];
    const expressionList = expressions.map((exp) => {
        const start = exp.start as number;
        let str;
        if (t.isIdentifier(exp)) {
            const { name } = exp;
            str = name;
            console.log('prop name', name);
            expressionProps.push(
                t.objectProperty(
                    t.identifier(name),
                    t.identifier(name),
                    false,
                    true,
                ),
            );
        }
        return {
            start,
            str: `{{${str}}}`,
        };
    });
    const templateStr = quasisList.concat(expressionList)
        .sort(
            (a, b) => (a.start > b.start ? 1 : -1))
        .map(({ str }) => str)
        .join('');
    let call;
    if (expressionProps.length) {
        const varObject = t.objectExpression(expressionProps);
        call = warpCallExpression(funcName, templateStr, varObject);
    } else {
        call = warpCallExpression(funcName, templateStr);
    }
    const { id } = saveKey({
        key: '',
        value: templateStr,
    });
    t.addComment(call, 'leading', `i18n-${id}`);
    return call;
}

export function wrapObjectStringLiteralProps(
    node: t.ObjectExpression,
    funcName: string,
    saveKey: SaveKeyFn = defaultSaveKeyFn,
): t.ObjectExpression {
    // eslint-disable-next-line no-debugger
    node.properties.forEach((prop) => {
        if (t.isObjectProperty(prop)) {
            if (t.isStringLiteral(prop.value)) {
                prop.value = wrapStringLiteral(prop.value, funcName, saveKey);
            }
            if (t.isTemplateLiteral(prop.value)) {
                const call = wrapTemplateLiteral(prop.value, funcName, saveKey);
                if (call) {
                    prop.value = call;
                }
            }
        }
    });
    return node;
}

export function addImportDeclare(nodePath: NodePath<t.Program>, i18n: CliConfigI18n): void {
    const id = t.identifier(i18n.functionName);
    const importSpecifier = t.importSpecifier(id, id);
    const str = t.stringLiteral(i18n.path);
    str.extra = {
        raw: `'${i18n.path}'`,
        rawValue: i18n.path,
    }
    const importDeclaration = t.importDeclaration(
        [importSpecifier],
        str
    );
    // @ts-ignore
    nodePath.unshiftContainer('body', importDeclaration);
}
