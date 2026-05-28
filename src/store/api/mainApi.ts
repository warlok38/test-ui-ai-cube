import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ADMIN_TAG_TYPES } from './admin/consts'

export const mainApi = createApi({
  reducerPath: 'mainApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_CUBE_API_URL ?? ''
  }),
  tagTypes: [...ADMIN_TAG_TYPES],
  endpoints: () => ({})
})
