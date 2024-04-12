import type { } from 'react';
import { Table, Button, Input, type TableColumnProps } from 'antd';
import { I18nItem, isSame, isRecover, KEYS } from './i18n.ts';
import './I18nTable.css';

const columns: TableColumnProps<I18nItem>[] = [
    {
        title: '编号',
        dataIndex: 'id',
        key: 'id',
        sorter: {
            compare: (a, b) => b.id - a.id,
            multiple: 2,
        },
    },
    {
        title: 'key',
        dataIndex: 'key',
        key: 'key',
    },
    {
        title: 'value',
        dataIndex: 'value',
        key: 'value',
        sorter: {
            compare: (a, b) => a.value > b.value ? 1 : -1,
            multiple: 1,
        },
    },
    {
        title: '位置',
        key: 'location',
        render: (_, record) => {
            const {
                file,
                loc,
            } = record;
            let pos = '';
            if (loc && loc.start && loc.start.line) {
                const { line, column} = loc.start;
                pos = `${line}:${column}`
            }

            return (
                <span>
                    {file} {pos}
                </span>
            )
        }
    },
    {
        title: '标记',
        dataIndex: 'tag',
        key: 'tag',
    },
    {
        title: '操作',
        key: 'operate',

    }
]

export default function I18nTable({
    list,
    updateItem,
} : {
    list: I18nItem[];
    updateItem: (item: I18nItem, update: (record: I18nItem) => I18nItem) => void;
}) {

    function rowClassName(record: I18nItem) {
        if (isSame(record)) {
            return 'same-row';
        }
        if (isRecover(record)) {
            return 'recover-row';
        }
        return '';
    }

    const changeKey = (record: I18nItem, newKey: I18nItem['key']) =>
        updateItem(
            record,
            record => {
                record.key = newKey;
                return record;
            }
        )

    columns[1].render = (_, record) => {
        return (
            isSame(record)
                ? <>
                    <span>{record.key} </span>
                    <Button
                        size='small'
                        onClick={() => changeKey(record,"")}
                    >clear</Button>
                  </>
                : <Input
                    allowClear={true}
                    placeholder='留空则直接使用 value'
                    value={record.key}
                    onChange={(evt) => {
                        changeKey(record, evt.target.value)
                    }}
                />
        )
    }

    columns[5].render = (_, record) => {
        const disable = isSame(record);
        const recover = isRecover(record);
        return (
            <>
                {
                    recover
                    ? <Button
                            disabled={disable}
                            onClick={() => changeKey(record, '')}
                        >启用</Button>
                    : <Button
                        disabled={disable}
                        onClick={() => changeKey(record, KEYS.RECOVER)}
                    >还原</Button>
                }
            </>
        )
    }
    return (
        <Table
            bordered={true}
            className='i18n-rc-table'
            rowKey='id'
            columns={columns}
            dataSource={list}
            rowClassName={rowClassName}
        />
    )
}