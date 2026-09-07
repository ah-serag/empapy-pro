import { apiSlice } from '../app/api/apiSlice';


export const supplierApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    getSuppliers: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.search) queryParams.append('search', params.search.trim());
        if (params.status) queryParams.append('status', params.status);
        
        return `/api/suppliers?${queryParams.toString()}`;
      },
      providesTags: ['Suppliers' ,"SupplierTransactions"],
    }),




    createSupplier: builder.mutation({
      query: (payload) => ({
        url: '/api/suppliers',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Suppliers' ,"SupplierTransactions"],
    }),
    
    updateSupplier: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/suppliers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Suppliers' , "SupplierTransactions"],
    }),

    getSuppliersForSelect: builder.query({
      query: () => '/api/suppliers/select',
      providesTags: ['Suppliers'],
    }),

    getSupplierTransactions: builder.query({
      query: (params) => {
        return {
          url: '/api/suppliers/supplier-transactions',
          method: 'GET',
          params: params, 
        };
      },
      providesTags: ['SupplierTransactions'],
    }),


  }),
});

export const { 
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useGetSuppliersForSelectQuery ,
  useGetSuppliersQuery ,
  useGetSupplierTransactionsQuery
} = supplierApiSlice;