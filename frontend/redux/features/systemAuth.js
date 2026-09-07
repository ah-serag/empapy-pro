
import { createSlice } from "@reduxjs/toolkit";



const initialState = {
    user: null,
    initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.initialized  = true 
    },
    finishInitialization(state) {
    state.initialized = true;
     },
    clearUser(state) {
      state.user = null;
    },
  },
});

export const {
  setUser,
  clearUser,
  finishInitialization 
} = authSlice.actions;

export default authSlice.reducer;