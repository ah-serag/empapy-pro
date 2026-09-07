import { apiSlice } from '../app/api/apiSlice';

export const locationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // المجمع
    getGovernoratesAndZones: builder.query({
      query: () => `/api/governorates/all`,
      providesTags: ['Governorates', 'Zones'],
    }),

    // Governorates Mutations
    createGovernorate: builder.mutation({
      query: (data) => ({ url: '/api/governorates', method: 'POST', body: data }),
      invalidatesTags: ['Governorates'],
    }),
    updateGovernorate: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/api/governorates/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Governorates'],
    }),
    deleteGovernorate: builder.mutation({
      query: (id) => ({ url: `/api/governorates/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Governorates'],
    }),

    // Zones Mutations
    createZone: builder.mutation({
      query: (data) => ({ url: '/api/zones', method: 'POST', body: data }),
      invalidatesTags: ['Zones', 'Governorates'], // عشان يُحدث العرض المجمع
    }),
    updateZone: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/api/zones/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Zones', 'Governorates'],
    }),
    deleteZone: builder.mutation({
      query: (id) => ({ url: `/api/zones/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Zones', 'Governorates'],
    }),

  }),
});

export const {
  useGetGovernoratesAndZonesQuery,
  useCreateGovernorateMutation,
  useUpdateGovernorateMutation,
  useDeleteGovernorateMutation,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
} = locationsApiSlice;