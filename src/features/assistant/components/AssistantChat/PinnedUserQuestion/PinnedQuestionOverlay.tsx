'use client'

import classNames from 'classnames'
import type { Ref } from 'react'

import styles from './PinnedUserQuestion.module.css'
import { QuestionBubbleContent } from './QuestionBubbleContent'

type PinnedQuestionOverlayProps = {
  text: string
  visible: boolean
  measureRef: Ref<HTMLDivElement>
  isMultiline: boolean
  isExpanded: boolean
  onToggleExpanded: () => void
}

export function PinnedQuestionOverlay({
  text,
  visible,
  measureRef,
  isMultiline,
  isExpanded,
  onToggleExpanded
}: PinnedQuestionOverlayProps) {
  return (
    <div className={styles.pinnedAnchor} aria-hidden={!visible}>
      <div
        className={classNames(
          styles.pinnedOverlay,
          visible ? styles.pinnedVisible : styles.pinnedHidden
        )}
      >
        <div ref={measureRef} className={styles.measureText} aria-hidden>
          {text}
        </div>

        <QuestionBubbleContent
          text={text}
          isCollapsed={isMultiline}
          showToggle={visible && isMultiline}
          isExpanded={isExpanded}
          onToggleExpanded={onToggleExpanded}
        />
      </div>
    </div>
  )
}
