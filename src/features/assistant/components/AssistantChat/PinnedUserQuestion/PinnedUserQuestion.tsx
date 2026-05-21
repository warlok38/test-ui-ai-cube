'use client'

import type { Ref } from 'react'

import { PinnedQuestionOverlay } from './PinnedQuestionOverlay'
import { usePinnedUserQuestion } from './usePinnedUserQuestion'
import { UserQuestionFlowBubble } from './UserQuestionFlowBubble'

export type PinnedUserQuestionProps = {
  messageId: string
  activePinnedMessageId: string | null
  text: string
  innerRef?: Ref<HTMLDivElement>
}

export function PinnedUserQuestion({
  messageId,
  activePinnedMessageId,
  text,
  innerRef
}: PinnedUserQuestionProps) {
  const isActivePin = messageId === activePinnedMessageId

  const {
    measureRef,
    setFlowRef,
    showOverlay,
    hideFlowBubble,
    isMultiline,
    isExpanded,
    handleToggleExpanded
  } = usePinnedUserQuestion({ text, isActivePin, innerRef })

  return (
    <>
      <UserQuestionFlowBubble text={text} hidden={hideFlowBubble} innerRef={setFlowRef} />

      <PinnedQuestionOverlay
        messageId={messageId}
        text={text}
        visible={showOverlay}
        measureRef={measureRef}
        isMultiline={isMultiline}
        isExpanded={isExpanded}
        onToggleExpanded={handleToggleExpanded}
      />
    </>
  )
}
