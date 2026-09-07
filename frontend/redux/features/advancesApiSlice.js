import { apiSlice } from "../app/api/apiSlice";


export const advancesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    getAdvances: builder.query({
      query: ({ page = 1, limit = 10, search = '' }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        
        return {
          url: `/api/advances?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Advance'],
    }),
    
    createAdvance: builder.mutation({
      query: (advanceData) => ({
        url: '/api/advances',
        method: 'POST',
        body: advanceData,
      }),
      invalidatesTags: ['Advance', 'Safes'], 
    }),

    cancelAdvance: builder.mutation({
      query: (id) => ({
        url: `/api/advances/${id}/cancel`,
        method: 'PUT', 
      }),
      invalidatesTags: ['Advance', 'Safes'], 
    }),
    
  }),
});

export const { 
  useGetAdvancesQuery, 
  useCreateAdvanceMutation ,
  useCancelAdvanceMutation
} = advancesApiSlice;