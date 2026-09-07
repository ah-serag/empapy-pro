

import { apiSlice } from '../app/api/apiSlice';

export const serviceCommissionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    upsertServiceCommission: builder.mutation({
      query: (data) => ({
        url: "/api/service-commissions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Services"], 
    }),

  }),
});

export const {
  useUpsertServiceCommissionMutation,
} = serviceCommissionApiSlice;