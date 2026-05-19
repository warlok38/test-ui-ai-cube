'use client'

import {
  BulbOutlined,
  EllipsisOutlined,
  QuestionCircleOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Avatar, Dropdown } from 'antd'
import { useState } from 'react'

import { ThemeSwitch } from '@/components/ThemeSwitch/ThemeSwitch'
import { ServiceInfoModal } from '@/features/assistant/components/ServiceInfo'

import styles from './SideBarFooter.module.css'

const SIDEBAR_USER_NAME = 'Пользователь'

export function SideBarFooter() {
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
        <BulbOutlined className={styles.menuIcon} aria-hidden />
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
        <QuestionCircleOutlined className={styles.menuIcon} aria-hidden />
        <span>Инфо</span>
      </button>
    </div>
  )

  return (
    <footer className={styles.footer}>
      <Avatar className={styles.avatar} icon={<UserOutlined />} size="small" />
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
        >
          <EllipsisOutlined />
        </button>
      </Dropdown>

      <ServiceInfoModal open={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
    </footer>
  )
}
