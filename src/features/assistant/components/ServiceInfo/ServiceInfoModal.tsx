'use client'

import { Modal, Typography } from 'antd'

import styles from './ServiceInfo.module.css'
import { SERVICE_INFO_MODAL_SECTIONS, SERVICE_INFO_SECTIONS } from './serviceInfoSections'

type ServiceInfoModalProps = {
  open: boolean
  onClose: () => void
}

export function ServiceInfoModal({ open, onClose }: ServiceInfoModalProps) {
  return (
    <Modal
      title="Справка по ИИ модулю"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <div className={styles.modalBody}>
        {SERVICE_INFO_MODAL_SECTIONS.map((sectionKey, index) => {
          const section = SERVICE_INFO_SECTIONS[sectionKey]

          return (
            <section key={sectionKey} className={styles.modalSection}>
              <Typography.Title level={5} className={styles.modalSectionTitle}>
                {section.title}
              </Typography.Title>
              {section.content}
              {index < SERVICE_INFO_MODAL_SECTIONS.length - 1 ? (
                <hr className={styles.modalDivider} />
              ) : null}
            </section>
          )
        })}
      </div>
    </Modal>
  )
}
