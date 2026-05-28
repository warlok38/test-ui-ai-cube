export const ADMIN_TAG_TYPES = ['CubeStats', 'QueryLogs'] as const

export type ExportLogsBody = {
  format: 'csv' | 'json' | 'xlsx'
}
