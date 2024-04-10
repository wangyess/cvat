import { Modal } from 'antd';

const taskID = 1;

function onClickMenu(params: Object) {

}

const params = {};

Modal.confirm({
    title: `The task ${taskID} will be deleted`,
    content: 'All related data (images, annotations) will be lost. Continue?',
    className: 'cvat-modal-confirm-delete-task',
    onOk: () => {
        onClickMenu(params);
    },
    okButtonProps: {
        type: 'primary',
        danger: true,
    },
    okText: 'Delete',
});