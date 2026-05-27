import { listAdminQueryLogs, listLogs } from '@/fakeBackend/db/repo'
import { randomDelay } from '@/fakeBackend/api/delay'
import type { AdminQueryLog } from '@/services/admin/types'
import { mainApi } from '../mainApi'
import type { ExportLogsBody } from './consts'

export const adminLogsApi = mainApi.injectEndpoints({
  endpoints: (builder) => ({
    queryLogs: builder.query<AdminQueryLog[], { limit?: number; offset?: number } | void>({
      async queryFn(arg) {
        await randomDelay(150, 350)
        const limit = typeof arg === 'object' ? arg.limit : undefined
        const offset = typeof arg === 'object' ? arg.offset : undefined
        const data = listAdminQueryLogs({ limit, offset })
        return { data }
      },
      providesTags: ['QueryLogs']
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
    })
  }),
  overrideExisting: false
})

export const { useQueryLogsQuery, useExportLogsBinaryMutation } = adminLogsApi
