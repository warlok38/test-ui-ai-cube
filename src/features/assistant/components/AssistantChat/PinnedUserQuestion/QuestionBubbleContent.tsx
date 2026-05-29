'use client'

import { DownOutlined, UpOutlined } from '@ant-design/icons'
import classNames from 'classnames'

import styles from './PinnedUserQuestion.module.css'

export type QuestionBubbleContentProps = {
  text: string
  cancelled?: boolean
  isCollapsed: boolean
  showToggle: boolean
  isExpanded: boolean
  onToggleExpanded: () => void
}

export function QuestionBubbleContent({
  text,
  cancelled = false,
  isCollapsed,
  showToggle,
  isExpanded,
  onToggleExpanded
}: QuestionBubbleContentProps) {
  return (
    <>
      <div className={classNames(styles.text, isCollapsed && !isExpanded && styles.textCollapsed)}>
        {text}
      </div>

      {cancelled ? <div className={styles.cancelledNote}>Запрос отменен</div> : null}

      {showToggle ? (
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggleExpanded}
          aria-label={isExpanded ? 'Свернуть вопрос' : 'Развернуть вопрос'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <UpOutlined /> : <DownOutlined />}
        </button>
      ) : null}
    </>
  )
}
