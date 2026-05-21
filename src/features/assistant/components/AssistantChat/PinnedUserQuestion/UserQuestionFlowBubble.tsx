'use client'

import classNames from 'classnames'

import { QuestionBubbleContent } from './QuestionBubbleContent'

import styles from './PinnedUserQuestion.module.css'

type UserQuestionFlowBubbleProps = {
  text: string
  hidden: boolean
  innerRef: (node: HTMLDivElement | null) => void
}

export function UserQuestionFlowBubble({ text, hidden, innerRef }: UserQuestionFlowBubbleProps) {
  return (
    <div
      ref={innerRef}
      className={classNames(styles.flowBubble, hidden && styles.flowHidden)}
      aria-hidden={hidden}
    >
      <QuestionBubbleContent
        text={text}
        isCollapsed={false}
        showToggle={false}
        isExpanded
        onToggleExpanded={() => {}}
      />
    </div>
  )
}
