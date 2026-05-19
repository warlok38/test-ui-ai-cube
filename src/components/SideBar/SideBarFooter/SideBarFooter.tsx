'use client'

import {
  BulbOutlined,
  EllipsisOutlined,
  QuestionCircleOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Avatar, Dropdown } from 'antd'
import classNames from 'classnames'
import { useState } from 'react'

import { ThemeSwitch } from '@/components/ThemeSwitch/ThemeSwitch'
import { ServiceInfoModal } from '@/features/assistant/components/ServiceInfo'

import styles from './SideBarFooter.module.css'

const SIDEBAR_USER_NAME = 'Пользователь'

type SideBarFooterProps = {
  isCollapsed?: boolean
}

export function SideBarFooter({ isCollapsed = false }: SideBarFooterProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)

  const handleInfoClick = () => {
    setMenuOpen(false)
    setInfoModalOpen(true)
  }

  const menuPanel = (
    <div className={styles.menuPanel} role="menu">
      <div
        className={`${styles.menuItem} ${styles.menuItemTheme}`}
        role="menuitem"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <BulbOutlined className={styles.menuIcon} />
        <span>Тема</span>
        <span
          className={styles.menuItemAction}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <ThemeSwitch size="small" />
        </span>
      </div>
      <button type="button" className={styles.menuItem} role="menuitem" onClick={handleInfoClick}>
        <QuestionCircleOutlined className={styles.menuIcon} />
        <span>Инфо</span>
      </button>
    </div>
  )

  return (
    <footer className={classNames(styles.footer, { [styles.footerCollapsed]: isCollapsed })}>
      <Avatar className={styles.avatar} icon={<UserOutlined />} size="small" />
      {!isCollapsed && (
        <div className={styles.footerExtra}>
          <span className={styles.userName}>{SIDEBAR_USER_NAME}</span>
          <Dropdown
            open={menuOpen}
            onOpenChange={setMenuOpen}
            trigger={['click']}
            placement="topRight"
            popupRender={() => menuPanel}
            getPopupContainer={() => document.body}
            classNames={{ root: styles.dropdownOverlay }}
          >
            <button
              type="button"
              className={styles.menuButton}
              aria-label="Меню пользователя"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              tabIndex={isCollapsed ? -1 : 0}
            >
              <EllipsisOutlined />
            </button>
          </Dropdown>
        </div>
      )}

      <ServiceInfoModal open={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
    </footer>
  )
}
