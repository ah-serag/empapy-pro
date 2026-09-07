import { apiSlice } from "../app/api/apiSlice";

export const treasurySafesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // safes 
    getAllSafes: builder.query({
      query: () => '/api/treasury/safes/getAllSafes',
      providesTags: ['Safes'],
    }),

    createSafe: builder.mutation({
      query: (data) => ({
        url: '/api/treasury/safes/createSafe',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Safes'],
    }),

    toggleSafeStatus: builder.mutation({
      query: ({ id, is_active }) => ({
        url: `/api/treasury/safes/toggleSafeStatus/${id}/status`,
        method: 'PATCH',
        body: { is_active },
      }),
      invalidatesTags: ['Safes'],
    }),
    getAvailableSafes: builder.query({
      query: () => '/api/treasury/safes/getAvailableSafes',
      providesTags: ['Safes'],
    }),



    getCompanySafes: builder.query({
      query: () => '/api/treasury/safes/company',
      providesTags: ['Safes'], 
    }),
    getTechnicianWallets: builder.query({
      query: () => '/api/treasury/safes/technician-wallets',
      providesTags: ['Safes'],
    }),









   // accounts 
    getAllAccounts: builder.query({
      query: () => '/api/treasury/accounts/getAllAccounts',
      providesTags: ['Accounts'],
    }),
    createAccount: builder.mutation({
      query: (data) => ({
        url: '/api/treasury/accounts/createAccount',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Accounts'],
    }),
    getAccountsList: builder.query({
      query: () => '/api/treasury/accounts/list',
      providesTags: ['Accounts'], 
    }),


  // trasactions 
  getTreasuryTransactions: builder.query({
      query: (params) => ({
        url: "/api/treasury/transactions",
        params, 
      }),
      providesTags: ["TreasuryTransactions"],
    }),


      //vouchers 

 createVoucher: builder.mutation({
      query: (data) => ({
        url: "/api/treasury/vouchers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Vouchers", "TreasuryTransactions" ,"Safes"] ,
    }),

    getVouchers: builder.query({
      query: (params) => ({
        url: "/api/treasury/vouchers",
        method: "GET",
        params: params, 

      }),
      providesTags: ["Vouchers"] ,
    }),

    getVoucherById: builder.query({
      query: (id) => ({
        url: `/api/treasury/vouchers/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Vouchers", id }],
    }),






  }),
 


 


});

export const {
  useGetAllSafesQuery,
  useCreateSafeMutation,
  useToggleSafeStatusMutation,
  useGetAvailableSafesQuery,
   useGetCompanySafesQuery ,
   useGetTechnicianWalletsQuery,
  // accounts 
  useGetAllAccountsQuery,
  useCreateAccountMutation ,
  useGetAccountsListQuery ,

  // transactions 
  useGetTreasuryTransactionsQuery ,

  //vouchers 
  useCreateVoucherMutation,
  useGetVouchersQuery,
  useGetVoucherByIdQuery
} = treasurySafesApiSlice;











