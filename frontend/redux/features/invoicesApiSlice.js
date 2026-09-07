import { apiSlice } from './../app/api/apiSlice'; 

export const invoicesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    getInvoices: builder.query({
      query: (params) => ({
        url: '/api/invoices', 
        method: 'GET',
        params, 
      }),
      providesTags: ['Invoices'], 
    }),

    createInvoice: builder.mutation({
      query: (invoiceData) => ({
        url: '/api/invoices/create',
        method: 'POST',
        body: invoiceData,
      }),
      invalidatesTags: ['Invoices' , "Assignments"], 
    }),

    updateInvoiceStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/api/invoices/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Invoices'], 
    }),
   
    recordInvoicePayment: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/invoices/${id}/payments`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Invoices", "TreasuryTransactions"], 
    }),
 
  }),
  
  overrideExisting: false,
});

export const {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceStatusMutation,
  useRecordInvoicePaymentMutation
} = invoicesApiSlice;