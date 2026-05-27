'use client'

import { triggerBlobDownload } from '@/features/assistant/utils/exportTable'
import { useExportLogsBinaryMutation } from '@/store/api'

export type AdminLogsExportFormat = 'csv' | 'json' | 'xlsx'

export function useAdminLogsExport() {
  const [exportMutation, exportState] = useExportLogsBinaryMutation()

  const handleExport = async (format: AdminLogsExportFormat) => {
    const blob = await exportMutation({ format }).unwrap()
    let ext: AdminLogsExportFormat
    switch (format) {
      case 'xlsx':
        ext = 'xlsx'
        break
      case 'csv':
        ext = 'csv'
        break
      default:
        ext = 'json'
    }
    triggerBlobDownload(blob, `cube-logs-${Date.now()}.${ext}`)
  }

  return {
    handleExport,
    isLoading: exportState.isLoading
  }
}
