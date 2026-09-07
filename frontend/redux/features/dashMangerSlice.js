import { apiSlice } from './../app/api/apiSlice'; 

export const dashboardApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getBookingDash: builder.query({
            query: (params) => ({
                url: '/api/dashboard/bookings',
                params: params 
            }),
            providesTags: ['DashboardBooking'],
        }),
        getUsersDash: builder.query({
            query: () => '/api/dashboard/users',
            providesTags: ['DashboardUsers'],
        }),
        getTeamDash: builder.query({
            query: () => '/api/dashboard/teams',
            providesTags: ['DashboardTeams'],
        }),
        getAssignmentsDash: builder.query({
            query: (params) => ({
                url: '/api/dashboard/assignments',
                params: params 
            }),
            providesTags: ['DashboardAssignments'],
        }),
        getInvoicesDash: builder.query({
            query: (params) => ({
                url: '/api/dashboard/invoices',
                params: params 
            }),
            providesTags: ['DashboardInvoices'],
        }),
        getFinancialAmountDash: builder.query({
            query: (params) => ({
                url: '/api/dashboard/AllAmounts',
                params: params 
            }),
            providesTags: ['DashboardFinancial'],
        }),
        getTodayDash: builder.query({
            query: (params) => ({
                url: '/api/dashboard/TodayDash',
                params: params 
            }),
            providesTags: ['DashboardToday', 'DashboardBooking', 'DashboardAssignments', 'DashboardInvoices'],
        }) ,
        getExpensesDash: builder.query({
      query: (params) => ({
        url: "/api/dashboard/expenses",
        method: "GET",
        params,
      }),
      providesTags: ["ExpensesDash"],
    }),
    getCollectionsDash: builder.query({
      query: (params) => ({
        url: "/api/dashboard/collections",
        method: "GET",
        params,
      }),
      providesTags: ["CollectionsDash"],
    }),
    })
});

export const {
    useGetBookingDashQuery,
    useGetUsersDashQuery,
    useGetTeamDashQuery,
    useGetAssignmentsDashQuery,
    useGetInvoicesDashQuery,
    useGetFinancialAmountDashQuery,
    useGetTodayDashQuery ,
    useGetExpensesDashQuery,
  useGetCollectionsDashQuery,
} = dashboardApiSlice;