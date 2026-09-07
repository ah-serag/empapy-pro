import { apiSlice } from '../app/api/apiSlice';

export const servicesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // المجمع
    getCategoriesAndServices: builder.query({
      query: () => `/api/services-module/all`,
      providesTags: ['Categories', 'Services'],
    }),

    // ================= Categories =================
    getAllCategories: builder.query({
      query: (active_only) => `/api/services-module/categories${active_only ? '?active_only=true' : ''}`,
      providesTags: ['Categories'],
    }),
    getCategoryById: builder.query({
      query: (id) => `/api/services-module/categories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Categories', id }],
    }),
    createCategory: builder.mutation({
      query: (data) => ({ url: '/api/services-module/categories', method: 'POST', body: data }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/api/services-module/categories/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Categories'],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({ url: `/api/services-module/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories'],
    }),

    // ================= Services =================
    getAllServices: builder.query({
      query: ({ category_id, active_only } = {}) => {
        let params = new URLSearchParams();
        if (category_id) params.append('category_id', category_id);
        if (active_only) params.append('active_only', 'true');
        return `/api/services-module/services?${params.toString()}`;
      },
      providesTags: ['Services'],
    }),
    getServiceById: builder.query({
      query: (id) => `/api/services-module/services/${id}`,
      providesTags: (result, error, id) => [{ type: 'Services', id }],
    }),
    createService: builder.mutation({
      query: (data) => ({ url: '/api/services-module/services', method: 'POST', body: data }),
      invalidatesTags: ['Services'],
    }),
    updateService: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/api/services-module/services/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Services'],
    }),
    deleteService: builder.mutation({
      query: (id) => ({ url: `/api/services-module/services/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Services'],
    }),

  }),
});

export const {
  useGetCategoriesAndServicesQuery,
  useGetAllCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAllServicesQuery,
  useGetServiceByIdQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} = servicesApiSlice;