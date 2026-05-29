import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { assistantActions } from '@/features/assistant/model/assistantSlice'
import { createErrorFromUnknown, httpErrorToFetchBaseQueryError } from '@/shared/errors'
import { ChatStreamError, consumeChatStream } from '@/services/assistantWorkflow/consumeChatStream'
import type {
  CancelTaskResponse,
  ChatDetailEntity,
  ChatEntity,
  DeleteChatResponse,
  MessageEntity,
  MessageSendParams,
  PatchMessageVoteBody,
  PatchMessageVoteResponse
} from '@/services/assistantWorkflow/types'
import { invalidateTagsOnSuccess } from '@/store/api/invalidateTagsOnSuccess'

export const chatsApi = createApi({
  reducerPath: 'chatsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Chats', 'Chat', 'CubeStats', 'QueryLogs'],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<MessageEntity, MessageSendParams>({
      async queryFn(params, { dispatch, signal }) {
        try {
          const data = await consumeChatStream(params, {
            signal,
            onEvent: (event) => dispatch(assistantActions.applyStreamEvent(event))
          })
          return { data }
        } catch (error) {
          const httpError =
            error instanceof ChatStreamError ? error.httpError : createErrorFromUnknown(error)
          return { error: httpErrorToFetchBaseQueryError(httpError) }
        }
      },
      invalidatesTags: (result, error, arg) => {
        if (error) return []
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
      invalidatesTags: invalidateTagsOnSuccess<'Chats' | 'Chat' | 'CubeStats' | 'QueryLogs'>(['Chats'])
    }),

    voteMessage: builder.mutation<PatchMessageVoteResponse, PatchMessageVoteBody>({
      query: (body) => ({
        url: '/chats/vote',
        method: 'POST',
        body
      }),
      invalidatesTags: invalidateTagsOnSuccess<'Chats' | 'Chat' | 'CubeStats' | 'QueryLogs'>([
        'Chats',
        'CubeStats',
        'QueryLogs'
      ])
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
