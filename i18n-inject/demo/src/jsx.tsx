// @ts-ignore
import React from 'react';
// @ts-ignore
import Tabs from 'antd/lib/tabs';

// @ts-ignore
function GoBackButton(): JSX.Element {
    return (
        <>
            <div title="title1" />
            <Tabs.TabPane tab='Quality' key='key1'>
                <Text>Text1</Text>
            </Tabs.TabPane>
            <Tabs.TabPane tab='Quality' key='key2'/>
            <span>Delete</span>
        </>
    );
}

export default React.memo(GoBackButton);
