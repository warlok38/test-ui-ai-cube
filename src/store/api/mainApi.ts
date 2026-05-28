import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ADMIN_TAG_TYPES } from './admin/consts'
import { CHAT_TAG_TYPES } from './chats/consts'

export const mainApi = createApi({
  reducerPath: 'mainApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_CUBE_API_URL?.trim() || '/api'
  }),
  tagTypes: [...ADMIN_TAG_TYPES, ...CHAT_TAG_TYPES],
  endpoints: () => ({})
})
