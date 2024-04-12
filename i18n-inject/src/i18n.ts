import type { types as t } from '@babel/core';
import { extendLog } from './log';

const log = extendLog('i18n');
const logStore = extendLog('store');

// alias for integer
type int = number

/**
 * i18n translate item
 */
export interface I18nItem {
    id: int;
    key: string;
    value: string;
    cnValue?: string;
    file: string;
    loc?: t.SourceLocation;
    tag: string;
}

export class Store {
    list: I18nItem[] = [];
    lastId = 0;

    static recover(list: I18nItem[], lastId = 0) {
        const store = new Store()
        store.list = list;
        store.setLastId(lastId);
        return store;
    }

    setLastId(id: number) {
        this.lastId = Math.max(Math.floor(id), 0);
    }

    getNextId() {
        return ++this.lastId;
    }

    add(item: Partial<I18nItem>) {
        if (!('id' in item)) {
            item.id = this.getNextId();
        }
        item.cnValue = item.cnValue || '';
        logStore('add', item);
        this.list.push(item as I18nItem);
        return item as I18nItem;
    }
}

export interface RcRaw {
    list: I18nItem[];
    lastId: number;
}