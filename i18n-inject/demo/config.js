
module.exports = {
    i18n: {
        path: '@root/i18next',
        functionName: 't',
        resourceRawFile: 'raw.json',
        resourceFile: './i18n/en.js',
        resourceCNFile: './i18n/cn.js',
    },
    condition: {
        JSXAttribute: [
            'Tabs.TabPane[tab]',
            'div[title]'
        ],
        JSXInnerText: [
            'Text',
            'span'
        ],
        CallExpression: [
            'Modal.confirm',
            'foo'
        ]
    },
    srcDir: './src',
    srcPattern: '**/*.ts{,x}',
    destDir: './dist',
}