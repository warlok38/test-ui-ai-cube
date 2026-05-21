'use client'

import type { Ref } from 'react'

import { PinnedQuestionOverlay } from './PinnedQuestionOverlay'
import { usePinnedUserQuestion } from './usePinnedUserQuestion'
import { UserQuestionFlowBubble } from './UserQuestionFlowBubble'

export type PinnedUserQuestionProps = {
  text: string
  pinDisabled: boolean
  innerRef?: Ref<HTMLDivElement>
}

export function PinnedUserQuestion({ text, pinDisabled, innerRef }: PinnedUserQuestionProps) {
  const { measureRef, setFlowRef, showOverlay, isMultiline, isExpanded, handleToggleExpanded } =
    usePinnedUserQuestion({ text, pinDisabled, innerRef })

  return (
    <>
      <UserQuestionFlowBubble text={text} hidden={showOverlay} innerRef={setFlowRef} />

      <PinnedQuestionOverlay
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
