import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { assistantSlice } from '@/features/assistant/model/assistantSlice'
import { mainApi } from '@/store/api'
import { chatsApi } from '@/store/api/chatsApi'

export const rootReducer = combineReducers({
  [mainApi.reducerPath]: mainApi.reducer,
  [chatsApi.reducerPath]: chatsApi.reducer,
  [assistantSlice.name]: assistantSlice.reducer
})

export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof setupStore>

export function setupStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(mainApi.middleware, chatsApi.middleware)
  })
}

export type AppDispatch = ReturnType<typeof setupStore>['dispatch']
