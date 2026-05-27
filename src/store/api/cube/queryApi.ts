import { assistantActions } from '@/features/assistant/model/assistantSlice'
import type { CubeQueryEntity, CubeQueryParams } from '@/services/assistantWorkflow/types'
import { mainApi } from '../mainApi'
import { consumeExecuteQueryStream } from '@/store/utils/consumeExecuteQueryStream'
import { createExecuteQueryEventStream } from '@/store/utils/createExecuteQueryEventStream'

export const cubeQueryApi = mainApi.injectEndpoints({
  endpoints: (builder) => ({
    executeQuery: builder.mutation<CubeQueryEntity, CubeQueryParams>({
      async queryFn(body, { signal, dispatch }) {
        try {
          const stream = createExecuteQueryEventStream(body, { signal })
          const data = await consumeExecuteQueryStream(stream, { dispatch })
          return { data }
        } catch (error) {
          dispatch(assistantActions.clearStreaming())
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw error
          }
          const message = error instanceof Error ? error.message : 'Сбой выполнения запроса'
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: message,
              data: message
            }
          }
        } finally {
          dispatch(assistantActions.clearStreaming())
        }
      }
    })
  }),
  overrideExisting: false
})

export const { useExecuteQueryMutation } = cubeQueryApi
