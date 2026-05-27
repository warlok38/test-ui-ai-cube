import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { assistantSlice } from '@/features/assistant/model/assistantSlice'
import { chatsApi } from '@/store/api/chatsApi'
import { cubeApi } from '@/store/api/cubeApi'

export const rootReducer = combineReducers({
  [chatsApi.reducerPath]: chatsApi.reducer,
  [cubeApi.reducerPath]: cubeApi.reducer,
  [assistantSlice.name]: assistantSlice.reducer
})

export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof setupStore>

export function setupStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(chatsApi.middleware, cubeApi.middleware)
  })
}

export type AppDispatch = ReturnType<typeof setupStore>['dispatch']
