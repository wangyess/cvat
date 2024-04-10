import { t } from '@root/i18next';
import { Modal } from 'antd';
const taskID = 1;
function onClickMenu(params: Object) {}
const params = {};
Modal.confirm({
  title: t("The task {{taskID}} will be deleted", {
    taskID
  }),
  content: t("All related data (images, annotations) will be lost. Continue?"),
  className: t("cvat-modal-confirm-delete-task"),
  onOk: () => {
    onClickMenu(params);
  },
  okButtonProps: {
    type: 'primary',
    danger: true
  },
  okText: t("Delete")
});