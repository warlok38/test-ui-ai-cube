import { Alert } from 'antd'

import styles from './AssistantChat.module.css'

type CubeUnavailableAlertProps = {
  closable?: boolean
  onClose?: () => void
}

export function CubeUnavailableAlert({ closable = false, onClose }: CubeUnavailableAlertProps) {
  return (
    <Alert
      className={styles.cubeUnavailableAlert}
      type="warning"
      showIcon
      message="Куб недоступен"
      description="Отправка новых запросов временно заблокирована. Попробуйте позже."
      closable={closable}
      onClose={onClose}
    />
  )
}
