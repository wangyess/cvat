import { useState } from 'react'
import './App.css'
import { Button, Table, TableProps, Space } from 'antd';
import type { types as t } from '@babel/core';

const DISABLED_KEY = '#DISABLED_KEY';
const DUPLABLE_KEY_PREFIX = '#SAME_AS_';

export interface I18nItem {
    id: number;
    key: string;
    value: string;
    file: string;
    loc?: t.SourceLocation;
    tag: string;
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
function App() {
  const [lastId, saveLastId] = useState(0);
  const [list, setList] = useState<I18nItem[]>([]);
    function isDisabled(record: I18nItem) {
        return record.key === DISABLED_KEY;
    }
    function changeItemInList(record: I18nItem, update: (old: I18nItem) => I18nItem) {
        setList(
            list.map((item) => {
                if (item.id === record.id) {
                    return update(record);
                }
                return item;
            })
        )
    }
    function disableItem(record: I18nItem) {
        changeItemInList(record, record => {
            record.key = DISABLED_KEY
            return record;
        })
    }

    function enableItem(record: I18nItem) {
        changeItemInList(record, record => {
            record.key = ''
            return record;
        })
    }
    function disableDuplicate(list: I18nItem[]) {
        const map = new Map<string, number>();
        const newList = list.map((item) => {
            const { key, value, id } = item;
            const keyOrValue = key || value;
            if (map.has(keyOrValue)) {
                item.key = DUPLABLE_KEY_PREFIX + map.get(keyOrValue);
            } else {
                map.set(keyOrValue, id)
            }
            return item;
        })
        setList(newList);
    }
    const columns: TableProps<I18nItem>['columns'] = [
        {
            title: 'id',
            dataIndex: 'id',
            key: 'id',
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
            sortOrder: 'ascend',
            sorter: (a, b) => a.value > b.value ? 1 : -1,
        },
        {
            title: 'tag',
            dataIndex: 'tag',
            key: 'tag',
        },
        {
            title: '操作',
            key: 'operate',
            render: (_, record) => (
                <>
                    {
                        isDisabled(record)
                            ? <Button onClick={() => enableItem(record)}>启用</Button>
                            : <Button onClick={() => disableItem(record)}>禁用</Button>
                    }
                </>
            )
        },
    ];
  async function loadRCFile() {
      const [fileHandle] = await window.showOpenFilePicker(RCFileOption)
      console.log(fileHandle)
      const fileData = await fileHandle.getFile()
      console.log(fileData)
      const reader = new FileReader()
      reader.onload = () => {
          const result = reader.result;
          if (!result) { return }
          const text = result instanceof ArrayBuffer ? result.toString() : result;
          const data = JSON.parse(text)
          if (data && data.list) {
              saveLastId(data.lastId);
              setList(data.list)
          }
      };
      reader.readAsText(fileData, 'utf-8');
  }

  async function exportRCFile(){
      const fileHandle = await window.showSaveFilePicker({
          description: 'saving RC File'
      })
      const writable = await fileHandle.createWritable()
      const data = JSON.stringify({list, lastId}, null, 2);
      console.log('exporting', data)
      await writable.write(data);

      // Close the file and write the contents to disk.
      await writable.close();
  }
  return (
    <>
        <Space size='small'>
            <Button onClick={() => loadRCFile()}>导入</Button>
            <Button onClick={() => exportRCFile()}>导出</Button>
            <Button onClick={() => disableDuplicate(list)}>去重</Button>
        </Space>
        {list.length
            && (
                <>
                    <Table
                        className='rc-table'
                        rowKey='id'
                        columns={columns}
                        dataSource={list}
                        rowClassName={(record) => {
                            if(isDisabled(record)) {
                                return 'disable-row'
                            }
                            return ''
                        }}
                    />
                </>
            )
        }
    </>
  )
}

export default App
