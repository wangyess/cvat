"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addImportDeclare = exports.wrapObjectStringLiteralProps = exports.wrapTemplateLiteral = exports.wrapStringLiteral = exports.warpCallExpression = exports.getJSXElementName = exports.getJSXElementAndAttrName = exports.getCallExpressionName = void 0;
const core_1 = require("@babel/core");
const defaultSaveKeyFn = () => ({
    key: '',
    value: '',
    file: 'unknown',
    condition: 'unknown',
    id: -1,
    tag: 'default',
});
function getCallExpressionName(call) {
    const { callee } = call;
    if (core_1.types.isMemberExpression(callee)) {
        const { object, property } = callee;
        if (core_1.types.isIdentifier(object) && core_1.types.isIdentifier(property)) {
            return `${object.name}.${property.name}`;
        }
    }
    if (core_1.types.isIdentifier(callee)) {
        return callee.name;
    }
    return '';
}
exports.getCallExpressionName = getCallExpressionName;
function getJSXElementAndAttrName(path) {
    const element = path.parent;
    const attr = path.node;
    const elementName = core_1.types.isJSXIdentifier(element.name) ? element.name.name : '';
    if (core_1.types.isStringLiteral(attr.value)) {
        return `${elementName}[${attr.name.name}]`;
    }
    return '';
}
exports.getJSXElementAndAttrName = getJSXElementAndAttrName;
function getJSXElementName(node) {
    const tag = node.name;
    if (core_1.types.isJSXIdentifier(tag)) {
        console.log('tag', tag.name);
        return tag.name;
    }
    if (core_1.types.isJSXMemberExpression(tag)) {
        const object = tag.object;
        const property = tag.property;
        return `${object.name}.${property.name}`;
    }
    return '';
}
exports.getJSXElementName = getJSXElementName;
function warpCallExpression(funcName, key, variable = undefined) {
    const func = core_1.types.identifier(funcName);
    const tmpl = core_1.types.stringLiteral(key);
    const args = [tmpl];
    if (variable) {
        args.push(variable);
    }
    const call = core_1.types.callExpression(func, args);
    if (!call.extra) {
        call.extra = {};
    }
    call.extra.injected = true;
    return call;
}
exports.warpCallExpression = warpCallExpression;
function wrapStringLiteral(node, funcName, saveKey = defaultSaveKeyFn) {
    const { id } = saveKey({
        key: '',
        value: node.value,
    });
    const call = warpCallExpression(funcName, node.value);
    core_1.types.addComment(call, 'leading', `i18n-${id}`);
    return call;
}
exports.wrapStringLiteral = wrapStringLiteral;
function wrapTemplateLiteral(node, funcName, saveKey = defaultSaveKeyFn) {
    const { quasis, expressions } = node;
    // TODO support callExpression `${x()}`
    if (!expressions.every((exp) => core_1.types.isIdentifier(exp))) {
        return null;
    }
    const quasisList = quasis.map((qu) => ({
        start: qu.start,
        str: qu.value.cooked,
    }));
    const expressionProps = [];
    const expressionList = expressions.map((exp) => {
        const start = exp.start;
        let str;
        if (core_1.types.isIdentifier(exp)) {
            const { name } = exp;
            str = name;
            console.log('prop name', name);
            expressionProps.push(core_1.types.objectProperty(core_1.types.identifier(name), core_1.types.identifier(name), false, true));
        }
        return {
            start,
            str: `{{${str}}}`,
        };
    });
    const templateStr = quasisList.concat(expressionList)
        .sort((a, b) => (a.start > b.start ? 1 : -1))
        .map(({ str }) => str)
        .join('');
    let call;
    if (expressionProps.length) {
        const varObject = core_1.types.objectExpression(expressionProps);
        call = warpCallExpression(funcName, templateStr, varObject);
    }
    else {
        call = warpCallExpression(funcName, templateStr);
    }
    const { id } = saveKey({
        key: '',
        value: templateStr,
    });
    core_1.types.addComment(call, 'leading', `i18n-${id}`);
    return call;
}
exports.wrapTemplateLiteral = wrapTemplateLiteral;
function wrapObjectStringLiteralProps(node, funcName, saveKey = defaultSaveKeyFn) {
    // eslint-disable-next-line no-debugger
    node.properties.forEach((prop) => {
        if (core_1.types.isObjectProperty(prop)) {
            if (core_1.types.isStringLiteral(prop.value)) {
                prop.value = wrapStringLiteral(prop.value, funcName, saveKey);
            }
            if (core_1.types.isTemplateLiteral(prop.value)) {
                const call = wrapTemplateLiteral(prop.value, funcName, saveKey);
                if (call) {
                    prop.value = call;
                }
            }
        }
    });
    return node;
}
exports.wrapObjectStringLiteralProps = wrapObjectStringLiteralProps;
function addImportDeclare(nodePath, i18n) {
    const id = core_1.types.identifier(i18n.functionName);
    const importSpecifier = core_1.types.importSpecifier(id, id);
    const str = core_1.types.stringLiteral(i18n.path);
    str.extra = {
        raw: `'${i18n.path}'`,
        rawValue: i18n.path,
    };
    const importDeclaration = core_1.types.importDeclaration([importSpecifier], str);
    // @ts-ignore
    nodePath.unshiftContainer('body', importDeclaration);
}
exports.addImportDeclare = addImportDeclare;
