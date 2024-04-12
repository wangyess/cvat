import './App.css'
import { useI18nState } from './i18n.ts';
import { Button, Space } from 'antd';
import I18nTable from './I18nTable.tsx';

function App() {
    const {
        list,
        loadFile,
        saveFile,
        linkDuplicate,
        updateItem,
    } = useI18nState()
    return (
        <>
            <Space size='middle'>
                <Button
                    type={list.length ? 'default' : 'primary'}
                    onClick={() => loadFile()}
                >导入</Button>
                <Button
                    type={list.length ? 'primary' : 'default'}
                    onClick={() => saveFile()}
                >导出</Button>
                <Button
                    onClick={() => linkDuplicate()}
                >去重</Button>
            </Space>
            {
                list.length ? (
                    <>
                        <div> {list.length} 个项目</div>
                        <I18nTable
                            list={list}
                            updateItem={updateItem}
                        />
                    </>
                ) : <div></div>
            }
        </>
    )
}

export default App
