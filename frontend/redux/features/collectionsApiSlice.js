import { apiSlice } from './../app/api/apiSlice'; 

export const collectionsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllCollections: builder.query({
      query: (params) => ({
        url: "/api/collections",
        params, 
      }),
      providesTags: ["Collections"],
    }), 
    remitCollection: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/collections/${id}/remit`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Collections", "TreasuryTransactions" , "Safes"], 
    }),
  }),
});

export const { useGetAllCollectionsQuery, useRemitCollectionMutation } = collectionsApiSlice;