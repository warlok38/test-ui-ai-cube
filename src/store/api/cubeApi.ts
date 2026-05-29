import { createApi } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import { aggregateCubeStats, listAdminQueryLogs, listLogs } from '@/shared/modules/fakeDb/repo'
import { randomDelay } from '@/shared/modules/fakeApi/delay'
import type { AdminQueryLog, CubeStats } from '@/services/admin/types'

const noopBaseQuery: BaseQueryFn = async () => ({ data: null })

export type ExportLogsBody = {
  format: 'csv' | 'json' | 'xlsx'
}

export const cubeApi = createApi({
  reducerPath: 'cubeApi',
  baseQuery: noopBaseQuery,
  tagTypes: ['CubeStats', 'QueryLogs'],
  endpoints: (builder) => ({
    cubeStats: builder.query<CubeStats, void>({
      async queryFn() {
        await randomDelay(180, 400)
        return { data: aggregateCubeStats() }
      },
      providesTags: ['CubeStats']
    }),

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
  })
})

export const { useCubeStatsQuery, useQueryLogsQuery, useExportLogsBinaryMutation } = cubeApi
