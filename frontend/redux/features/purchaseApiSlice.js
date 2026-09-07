import { apiSlice } from "../app/api/apiSlice";


export const purchaseApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    createPurchaseInvoice: builder.mutation({
      query: (payload) => ({
        url: '/api/purchases/invoices',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [
        'Suppliers',          
        'Inventory',           
        'InventoryTransactions', 
        'Materials',          
        'Safes',                
        'TreasuryTransactions'  
      ],
    }),
    
   getPurchaseInvoices: builder.query({
      query: (params) => ({
        url: "/api/purchases/invoices",
        params,
      }),
      providesTags: ["PurchaseInvoices"],
    }),

    getPurchaseInvoiceDetails: builder.query({
      query: (id) => `/api/purchases/invoices/${id}`,
      providesTags: (result, error, id) => [{ type: "PurchaseInvoices", id }],
    }),

    payPurchaseInvoice: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/purchases/invoices/${id}/pay`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "PurchaseInvoices", id }, 
        "PurchaseInvoices" 
      ],
    }),

  }),
});

export const { 
  useCreatePurchaseInvoiceMutation  ,
  useGetPurchaseInvoiceDetailsQuery ,
  useGetPurchaseInvoicesQuery,
  usePayPurchaseInvoiceMutation
} = purchaseApiSlice;