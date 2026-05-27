import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  CancelTaskResponse,
  ChatDetailEntity,
  ChatEntity,
  DeleteChatResponse,
  MessageSendParams,
  PatchMessageVoteBody,
  PatchMessageVoteResponse,
  SendMessageResponse
} from '@/services/assistantWorkflow/types'

export const chatsApi = createApi({
  reducerPath: 'chatsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Chats', 'Chat', 'CubeStats', 'QueryLogs'],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<SendMessageResponse, MessageSendParams>({
      query: (body) => ({
        url: '/chats',
        method: 'POST',
        body
      }),
      invalidatesTags: (result, _error, arg) => {
        const tags: Array<'Chats' | { type: 'Chat'; id: string }> = ['Chats']
        if (arg.chat_id) tags.push({ type: 'Chat', id: arg.chat_id })
        if (result?.chat_id) tags.push({ type: 'Chat', id: result.chat_id })
        return tags
      }
    }),

    listChats: builder.query<ChatEntity[], void>({
      query: () => '/chats',
      providesTags: ['Chats']
    }),

    getChat: builder.query<ChatDetailEntity, string>({
      query: (chatId) => `/chats/${chatId}`,
      providesTags: (_result, _error, chatId) => [{ type: 'Chat', id: chatId }]
    }),

    deleteChat: builder.mutation<DeleteChatResponse, string>({
      query: (chatId) => ({
        url: `/chats/${chatId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Chats']
    }),

    voteMessage: builder.mutation<PatchMessageVoteResponse, PatchMessageVoteBody>({
      query: (body) => ({
        url: '/chats/vote',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Chats', 'CubeStats', 'QueryLogs']
    }),

    cancelTask: builder.mutation<CancelTaskResponse, string>({
      query: (taskId) => ({
        url: `/chats/cancel/${taskId}`,
        method: 'POST'
      })
    })
  })
})

export const {
  useSendMessageMutation,
  useListChatsQuery,
  useGetChatQuery,
  useDeleteChatMutation,
  useVoteMessageMutation,
  useCancelTaskMutation
} = chatsApi
