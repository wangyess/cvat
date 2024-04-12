import { t } from '@root/i18next';
import { Modal } from 'antd';
const taskID = 1;
function onClickMenu(params: Object) {}
const params = {};
Modal.confirm({
  title: /*i18n-4*/t("The task {{taskID}} will be deleted", {
    taskID
  }),
  content: /*i18n-5*/t("All related data (images, annotations) will be lost. Continue?"),
  className: /*i18n-6*/t("cvat-modal-confirm-delete-task"),
  onOk: () => {
    onClickMenu(params);
  },
  okButtonProps: {
    type: 'primary',
    danger: true
  },
  okText: /*i18n-7*/t("Delete")
});