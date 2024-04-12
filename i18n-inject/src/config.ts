
export type CliConfig = {
    i18n: {
        path: string;
        functionName: string;
        resourceFile: string;
        resourceCNFile: string;
        resourceRawFile: string;
    },
    condition: {
        JSXAttribute: string[];
        JSXInnerText: string[];
        CallExpression: string[];
    }
    srcDir: string;
    destDir: string;
    srcPattern: string;
    lastId: number;  // int
}

export type ConditionKeys = keyof CliConfig['condition'];
export type ConditionSets = Record<ConditionKeys, Set<string>>;
export type CliConfigI18n = CliConfig['i18n'];