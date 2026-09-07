import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import {apiSlice} from "./api/apiSlice"
import  authReducer from "../features/systemAuth";



export const store = configureStore({
  reducer:{
      [apiSlice.reducerPath]: apiSlice.reducer ,
       auth: authReducer 
  } ,
    
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),

  devTools: true ,
  // serializableCheck: false,
});




setupListeners(store.dispatch);
