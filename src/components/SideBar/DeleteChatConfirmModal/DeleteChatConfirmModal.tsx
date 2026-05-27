'use client'

import { Modal } from 'antd'

import styles from './DeleteChatConfirmModal.module.css'

export type DeleteChatConfirmModalProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  isDeleting?: boolean
}

export function DeleteChatConfirmModal({
  open,
  onCancel,
  onConfirm,
  isDeleting = false
}: DeleteChatConfirmModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={false}
      centered
      destroyOnHidden
      width={480}
      className={styles.modal}
      maskClosable={!isDeleting}
    >
      <div className={styles.content}>
        <p className={styles.title}>После удаления чат невозможно восстановить</p>
        <p className={styles.description}>История сообщений будет удалена.</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isDeleting}
          >
            Отмена
          </button>
          <button
            type="button"
            className={styles.deleteButton}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            Удалить чат
          </button>
        </div>
      </div>
    </Modal>
  )
}
