import Debug from 'debug';

export const BASE_LOG = Debug('inject-i18n');

export function extendLog(ns: string) {
    return BASE_LOG.extend(ns);
}