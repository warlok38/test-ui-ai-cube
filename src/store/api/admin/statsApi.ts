import { aggregateCubeStats } from '@/fakeBackend/db/repo'
import { randomDelay } from '@/fakeBackend/api/delay'
import type { CubeStats } from '@/services/admin/types'
import { mainApi } from '../mainApi'

export const adminStatsApi = mainApi.injectEndpoints({
  endpoints: (builder) => ({
    cubeStats: builder.query<CubeStats, void>({
      async queryFn() {
        await randomDelay(180, 400)
        return { data: aggregateCubeStats() }
      },
      providesTags: ['CubeStats']
    })
  }),
  overrideExisting: false
})

export const { useCubeStatsQuery } = adminStatsApi
