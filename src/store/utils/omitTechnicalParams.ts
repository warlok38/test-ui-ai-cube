import type { CubeQueryApiBody, CubeQueryParams } from '@/services/assistantWorkflow/types'

export function omitTechnicalParams(params: CubeQueryParams): CubeQueryApiBody {
  const { _technical: _ignored, ...apiBody } = params
  return apiBody
}
