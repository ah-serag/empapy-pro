
import { apiSlice } from './../app/api/apiSlice'; 


export const expensesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllExpenses: builder.query({
      query: (params) => ({
        url: "/api/manager/expenses",
        params, 
      }),
      providesTags: ["Expenses"],
    }),
    approveExpense: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/manager/expenses/${id}/approve`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Expenses", "TreasuryTransactions" ,"Safes"], 
    }),
    rejectExpense: builder.mutation({
      query: (id) => ({
        url: `/api/manager/expenses/${id}/reject`,
        method: "POST",
      }),
      invalidatesTags: ["Expenses" ], 
    }),
  }),
});

export const { useGetAllExpensesQuery, useApproveExpenseMutation, useRejectExpenseMutation } = expensesApiSlice;