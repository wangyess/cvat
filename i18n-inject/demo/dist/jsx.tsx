import { t } from '@root/i18next';
// @ts-ignore
import React from 'react';
// @ts-ignore
import Tabs from 'antd/lib/tabs';

// @ts-ignore
function GoBackButton(): JSX.Element {
  return <>
            <div title={t("title1")} />
            <Tabs.TabPane tab='Quality' key='key1'>
                <Text>{t("Text1")}</Text>
            </Tabs.TabPane>
            <Tabs.TabPane tab='Quality' key='key2' />
            <span>title2</span>
        </>;
}
export default React.memo(GoBackButton);