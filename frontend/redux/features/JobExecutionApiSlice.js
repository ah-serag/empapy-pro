import { apiSlice } from './../app/api/apiSlice'; 


export const jobExecutionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    getAllJobExecutions: builder.query({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters) {
          if (filters.search) params.append("search", filters.search);
          if (filters.status) params.append("status", filters.status);
          if (filters.start_date) params.append("start_date", filters.start_date);
          if (filters.end_date) params.append("end_date", filters.end_date);
          if (filters.page) params.append("page", filters.page.toString());
          if (filters.limit) params.append("limit", filters.limit.toString());
        }

        return {
          url: `/api/job/job-executions?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["JobExecutions"],
    }),
    
    approveExecution: builder.mutation({
      query: (payload) => ({
        url: '/api/job/approve',
        method: 'POST',
        body: payload, 
      }),
      invalidatesTags: ['JobExecutions', 'Assignments', 'Booking', 'Safes', 'Inventory', 'Invoices' , "TechnicianEarnings"], 
    }),

    rejectExecution: builder.mutation({
      query: ({ execution_id, rejection_reason }) => ({
        url: `/api/job/${execution_id}/reject`,
        method: 'POST',
        body: { rejection_reason },
      }),
      invalidatesTags: ['JobExecutions', 'Assignments', 'Booking'],
    }),




  }),
});

export const { 
  useGetAllJobExecutionsQuery, 
  useLazyGetAllJobExecutionsQuery ,
  useApproveExecutionMutation ,
  useRejectExecutionMutation

} = jobExecutionApiSlice;