import type { types as t } from '@babel/core';

import { useState } from 'react';

export interface I18nItem {
    id: number;
    key: string;
    value: string;
    file: string;
    loc?: t.SourceLocation;
    tag: string;
}

export interface RCRawFileData {
    lastId: number; // int
    list: I18nItem[];
}

export const KEYS = {
    SAME_PREFIX: '#SAME_AS_',
    RECOVER: '#RECOVER'
}

export function isSame(record: I18nItem) {
    return record.key.startsWith(KEYS.SAME_PREFIX);
}

export function isRecover(record: I18nItem) {
    return record.key === KEYS.RECOVER;
}

export async function loadRCRawFile() {
    const [fileHandle] = await window.showOpenFilePicker(RCFileOption)
    console.log(fileHandle)
    const fileData = await fileHandle.getFile()
    console.log(fileData)
    const reader = new FileReader()
    return new Promise<RCRawFileData>((resolve, reject) => {
        reader.onload = () => {
            const result = reader.result;
            if (!result) { return }
            const text = result instanceof ArrayBuffer ? result.toString() : result;
            const data = JSON.parse(text)
            if (data && data.list) {
                resolve(data)
            }
        };
        reader.onerror = reject;
        reader.readAsText(fileData, 'utf-8');
    })

}

export async function saveRCRawFile(data: RCRawFileData){
    const fileHandle = await window.showSaveFilePicker({
        description: 'saving RC File'
    })
    const writable = await fileHandle.createWritable()
    const json = JSON.stringify(data, null, 2);
    console.log('exporting', json)
    await writable.write(json);

    // Close the file and write the contents to disk.
    await writable.close();
}

export function useI18nState() {
    const [list, setList] = useState<I18nItem[]>([])
    const [lastId, setLastId] = useState(0)

    function linkDuplicate() {
        // key -> id;
        const map = new Map<string, number>();
        setList(list.map(item => {
            const { id, key, value } = item;
            // ignore special keys in KEYS;
            if (key.startsWith('#')) {
                return item;
            }
            const keyOrValue = key || value;
            const targetId = map.get(keyOrValue);
            if (typeof targetId !== 'undefined') {
                item.key = KEYS.SAME_PREFIX + targetId
            } else {
                map.set(keyOrValue, id);
            }
            return item;
        }))
    }
    function updateItem(record: I18nItem, update: (record: I18nItem) => I18nItem) {
        setList(list.map(item => {
            if (item.id === record.id) {
                return update(item);
            }
            return item;
        }))
    }
    return {
        list,
        setList,
        loadFile: async () =>  {
            const data = await loadRCRawFile();
            setList(data.list);
            setLastId(data.lastId);
        },
        saveFile: async () => {
            await saveRCRawFile({
                list,
                lastId,
            })
        },
        linkDuplicate,
        updateItem,
    }
}
const RCFileOption = {
    types: [
        {
            description: "I18n-Resource",
            accept: {
                "application/json": [".json"],
            },
        },
    ],
    multiple: false,
}
