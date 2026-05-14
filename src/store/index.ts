import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { assistantSlice } from '@/features/assistant/model/assistantSlice'
import { cubeApi } from '@/store/api/cubeApi'

export const rootReducer = combineReducers({
  [cubeApi.reducerPath]: cubeApi.reducer,
  [assistantSlice.name]: assistantSlice.reducer
})

export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof setupStore>

export function setupStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(cubeApi.middleware)
  })
}

export type AppDispatch = ReturnType<typeof setupStore>['dispatch']
