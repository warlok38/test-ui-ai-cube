'use client'

import { App } from 'antd'
import { useState } from 'react'
import { assistantActions } from '@/features/assistant/model/assistantSlice'
import { appendRequestLog } from '@/modules/fakeDb/repo'
import type { ValidMaxAttempts } from '@/services/assistantWorkflow/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { cubeApi, useExecuteQueryMutation } from '@/store/api/cubeApi'

import { AssistantChatView } from './AssistantChatView'

export function AssistantChat() {
  const dispatch = useAppDispatch()
  const assistant = useAppSelector((s) => s.assistant)
  const { message } = App.useApp()
  const [executeQuery] = useExecuteQueryMutation()

  const [draft, setDraft] = useState('')

  const handleRun = async () => {
    const text = draft.trim()
    if (!text) {
      message.warning('Введите текст запроса перед запуском')
      return
    }

    const maxAttempts: ValidMaxAttempts = 3
    dispatch(assistantActions.startQuery({ prompt: text, maxAttempts }))

    const startedAt = performance.now()
    try {
      dispatch(
        assistantActions.setPhase({
          phase: 'fetching',
          currentAttempt: 1,
          maxAttempts
        })
      )
      const result = await executeQuery({ query: text, max_attempts: maxAttempts }).unwrap()
      dispatch(
        assistantActions.setPhase({
          phase: 'interpreting',
          currentAttempt: 1,
          maxAttempts
        })
      )

      const durationMs = Math.round(performance.now() - startedAt)
      let status: 'success' | 'server_unreachable' | 'failed_max' = 'failed_max'
      if (result.success) {
        status = 'success'
      } else if (assistant.technicalSettings.scenario === 'server_unreachable') {
        status = 'server_unreachable'
      }
      const log = appendRequestLog({
        userPrompt: text,
        finalDax: result.dax || null,
        status,
        attemptsUsed: result.success ? 1 : maxAttempts,
        retrySummaries: result.error ? [result.interpretation] : [],
        interpretation: result.interpretation,
        tableRows: result.success ? result.data : null,
        durationMs,
        feedback: null
      })
      dispatch(
        assistantActions.querySucceeded({
          prompt: text,
          result,
          logId: log.id
        })
      )
      dispatch(cubeApi.util.invalidateTags(['Metrics', 'Logs']))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Сбой выполнения запроса'
      dispatch(assistantActions.queryFailed(errorMessage))
    }

    setDraft('')
  }

  return (
    <AssistantChatView
      draft={draft}
      isRunning={assistant.isRunning}
      currentAttempt={assistant.currentAttempt}
      maxAttempts={assistant.maxAttempts}
      onDraftChange={setDraft}
      onRun={handleRun}
    />
  )
}
