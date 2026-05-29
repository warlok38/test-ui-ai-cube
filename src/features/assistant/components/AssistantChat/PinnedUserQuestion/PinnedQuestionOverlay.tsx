'use client'

import classNames from 'classnames'
import type { Ref } from 'react'

import styles from './PinnedUserQuestion.module.css'
import { QuestionBubbleContent } from './QuestionBubbleContent'

type PinnedQuestionOverlayProps = {
  messageId: string
  text: string
  cancelled?: boolean
  visible: boolean
  measureRef: Ref<HTMLDivElement>
  isMultiline: boolean
  isExpanded: boolean
  onToggleExpanded: () => void
}

export function PinnedQuestionOverlay({
  messageId,
  text,
  cancelled = false,
  visible,
  measureRef,
  isMultiline,
  isExpanded,
  onToggleExpanded
}: PinnedQuestionOverlayProps) {
  return (
    <div className={styles.pinnedAnchor} aria-hidden={!visible}>
      <div ref={measureRef} className={styles.measureText} aria-hidden>
        {text}
      </div>

      {visible ? (
        <div key={messageId} className={classNames(styles.pinnedZone, styles.pinnedVisible)}>
          <div className={styles.pinnedBackdrop} aria-hidden />
          <div data-message-id={messageId} className={styles.pinnedOverlay}>
            <QuestionBubbleContent
              text={text}
              cancelled={cancelled}
              isCollapsed={isMultiline}
              showToggle={isMultiline}
              isExpanded={isExpanded}
              onToggleExpanded={onToggleExpanded}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
