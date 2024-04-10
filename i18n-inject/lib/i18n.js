"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = void 0;
const log_1 = require("./log");
const log = (0, log_1.extendLog)('i18n');
const logStore = (0, log_1.extendLog)('store');
class Store {
    constructor() {
        this.list = [];
        this.lastId = 0;
    }
    static recover(list, lastId = 0) {
        const store = new Store();
        store.list = list;
        store.setLastId(lastId);
        return store;
    }
    setLastId(id) {
        this.lastId = Math.max(Math.floor(id), 0);
    }
    getNextId() {
        return ++this.lastId;
    }
    add(item) {
        if (!('id' in item)) {
            item.id = this.getNextId();
        }
        logStore('add', item);
        this.list.push(item);
        return item;
    }
}
exports.Store = Store;
