

import { apiSlice } from '../../redux/app/api/apiSlice'; 

export const wareHouseApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // materails categories 
    getMaterialCategories: builder.query({
      query: () => '/api/wareHouse/categories',
      providesTags: ['MaterialCategories'], 
    }),
    
    createMaterialCategory: builder.mutation({
      query: (newCategory) => ({
        url: '/api/wareHouse/categories',
        method: 'POST',
        body: newCategory,
      }),
      invalidatesTags: ['MaterialCategories'],
    }),
    
    deleteMaterialCategory: builder.mutation({
      query: (id) => ({
        url: `/api/wareHouse/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MaterialCategories'],
    }),


  
    // materails 
    getMaterials: builder.query({
      query: () => '/api/wareHouse/materials',
      providesTags: ['Materials', 'MaterialCategories'], 
    }),
    
    createMaterial: builder.mutation({
      query: (newMaterial) => ({
        url: '/api/wareHouse/materials',
        method: 'POST',
        body: newMaterial,
      }),
      invalidatesTags: ['Materials'],
    }),
    
    updateMaterial: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/api/wareHouse/materials/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Materials'],
    }),
    
    deactivateMaterial: builder.mutation({
      query: (id) => ({
        url: `/api/wareHouse/materials/${id}/deactivate`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Materials'],
    }),



    
    adjustInventory: builder.mutation({
      query: (inventoryData) => ({
        url: '/api/wareHouse/inventory/adjust',
        method: 'POST',
        body: inventoryData, 
      }),
      invalidatesTags: ['Materials', 'Inventory'], 
    }),


    // serail
    addSerial: builder.mutation({
      query: (serialData) => ({
        url: '/api/wareHouse/serials',
        method: 'POST',
        body: serialData,
      }),
      invalidatesTags: ['Materials', 'Inventory', 'Serials'],
    }),
    
    correctSerial: builder.mutation({
      query: ({ id, correct_serial_number }) => ({
        url: `/api/wareHouse/serials/${id}/correct`,
        method: 'PUT',
        body: { correct_serial_number },
      }),
      invalidatesTags: ['Serials'],
    }),



  // get inventory-transaction 


 getInventoryTransactions: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.material_id) queryParams.append('material_id', params.material_id.toString());
        if (params.transaction_type) queryParams.append('transaction_type', params.transaction_type);
        if (params.source) queryParams.append('source', params.source); 
        if (params.start_date) queryParams.append('start_date', params.start_date);
        if (params.end_date) queryParams.append('end_date', params.end_date);
        if (params.search) queryParams.append('search', params.search.trim());

        return `/api/wareHouse/inventory-transactions?${queryParams.toString()}`;
      },
      providesTags: ['InventoryTransactions', 'Materials'],
    }),









  }),
  overrideExisting: false, 
});

export const {
  // Material Categories Hooks
  useGetMaterialCategoriesQuery,
  useCreateMaterialCategoryMutation,
  useDeleteMaterialCategoryMutation,
  
  // Materials Hooks
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeactivateMaterialMutation,
  
  // Inventory Hook
  useAdjustInventoryMutation,
  
  // Serials Hooks
  useAddSerialMutation,
  useCorrectSerialMutation,


  //get inventory transaction 
  useGetInventoryTransactionsQuery

} = wareHouseApiSlice;