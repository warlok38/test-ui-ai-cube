import { createApi } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import { aggregateMetrics, listLogs, patchRequestFeedback } from '@/modules/fakeDb/repo'
import type { MetricsAggregate, RequestLogRecord, RequestFeedback } from '@/modules/fakeDb/schema'
import { randomDelay } from '@/modules/fakeApi/delay'

const noopBaseQuery: BaseQueryFn = async () => ({ data: null })

export type ExportLogsBody = {
  format: 'csv' | 'json' | 'xlsx'
}

export const cubeApi = createApi({
  reducerPath: 'cubeApi',
  baseQuery: noopBaseQuery,
  tagTypes: ['Metrics', 'Logs'],
  endpoints: (builder) => ({
    metrics: builder.query<MetricsAggregate, void>({
      async queryFn() {
        await randomDelay(180, 400)
        return { data: aggregateMetrics() }
      },
      providesTags: ['Metrics']
    }),

    logs: builder.query<RequestLogRecord[], { limit?: number; offset?: number } | void>({
      async queryFn(arg) {
        await randomDelay(150, 350)
        const limit = typeof arg === 'object' ? arg.limit : undefined
        const offset = typeof arg === 'object' ? arg.offset : undefined
        const data = listLogs({ limit, offset })
        return { data }
      },
      providesTags: ['Logs']
    }),

    exportLogsBinary: builder.mutation<Blob, ExportLogsBody>({
      async queryFn(body) {
        await randomDelay(120, 300)
        const logs = listLogs({ limit: 5000 })
        if (body.format === 'json') {
          const json = JSON.stringify(logs, null, 2)
          return {
            data: new Blob([json], { type: 'application/json' })
          }
        }

        const headers = [
          'createdAt',
          'userPrompt',
          'finalDax',
          'status',
          'attemptsUsed',
          'durationMs',
          'feedback'
        ]
        if (body.format === 'csv') {
          const lines = [
            headers.join(','),
            ...logs.map((row) =>
              headers
                .map(
                  (h) =>
                    `"${String((row as unknown as Record<string, unknown>)[h] ?? '').replaceAll(
                      '"',
                      '""'
                    )}"`
                )
                .join(',')
            )
          ]
          return { data: new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }) }
        }

        const XLSX = await import('xlsx')
        const sheet = XLSX.utils.json_to_sheet(logs)
        const book = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(book, sheet, 'logs')
        const buffer = XLSX.write(book, { bookType: 'xlsx', type: 'array' })
        return {
          data: new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          })
        }
      }
    }),

    submitFeedback: builder.mutation<boolean, { logId: string; feedback: RequestFeedback }>({
      async queryFn({ logId, feedback }) {
        await randomDelay(120, 250)
        const ok = patchRequestFeedback(logId, feedback)
        return { data: ok }
      },
      invalidatesTags: ['Logs', 'Metrics']
    })
  })
})

export const {
  useMetricsQuery,
  useLogsQuery,
  useExportLogsBinaryMutation,
  useSubmitFeedbackMutation
} = cubeApi
