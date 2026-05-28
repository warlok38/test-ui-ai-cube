import { patchRequestFeedback } from '@/fakeBackend/db/repo'
import { randomDelay } from '@/fakeBackend/api/delay'
import type { RequestFeedback } from '@/fakeBackend/db/schema'
import { mainApi } from '../mainApi'

export const adminFeedbackApi = mainApi.injectEndpoints({
  endpoints: (builder) => ({
    submitFeedback: builder.mutation<boolean, { logId: string; feedback: RequestFeedback }>({
      async queryFn({ logId, feedback }) {
        await randomDelay(120, 250)
        const ok = patchRequestFeedback(logId, feedback)
        return { data: ok }
      },
      invalidatesTags: ['QueryLogs', 'CubeStats']
    })
  }),
  overrideExisting: false
})

export const { useSubmitFeedbackMutation } = adminFeedbackApi
