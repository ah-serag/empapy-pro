import { apiSlice } from "../app/api/apiSlice";

export const teamApiInjection = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    getSupervisorAssignments: builder.query({
      query: () => ({
        url: "/api/team/assignments", 
        method: "GET",
      }),
      providesTags: ["Assignments"], 
    }),

  //start or revent
    startJobExecution: builder.mutation({
      query: (assignmentId) => ({
        url: `/api/team/start-execution/${assignmentId}`,
        method: "POST",
      }),
      invalidatesTags: ["Assignments"], 
    }),
  
   revertAssignmentExecution: builder.mutation({
      query: (assignmentId) => ({
        url: `/api/team/revert-execution/${assignmentId}`, 
        method: 'POST',
      }),
      invalidatesTags: ['Assignments'], 
    }),


    // member 
    searchActiveMembers: builder.query({
      query: (keyword) => ({
        url: `/api/team/searchMember`,
        method: "GET",
        params: { keyword }, 
      }),
    }),

    getActiveServicesList: builder.query({
      query: () => ({
        url: "/api/team/getServices",
        method: "GET",
      }),
    }),
    searchMaterialsForExecution: builder.query({
      query: (q) => ({
        url: `/api/team/materials/search-execution`, 
        params: { q }, 
      }),
 
    }),

 completeAssignment: builder.mutation({
      query: (payload) => ({
        url: `/api/team/submit-execution`, 
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Assignments', 'DashboardStats'], 
    }),


 // rejected 
    getRejectedExecutions: builder.query({
      query: (params) => ({
        url: '/api/team/rejected',
        method: 'GET',
        params,
      }),
      providesTags: ['JobExecutions'],
    }),

    updateRejectedExecution: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/team/rejected/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['JobExecutions', 'Assignments', 'Booking'],
    }),


  }),
  overrideExisting: false,
});

export const {
  useGetSupervisorAssignmentsQuery,
  useStartJobExecutionMutation , 
  useRevertAssignmentExecutionMutation ,
  useLazySearchActiveMembersQuery, 
  useGetActiveServicesListQuery,
  useCompleteAssignmentMutation,
  useLazySearchMaterialsForExecutionQuery ,
  // rejected 
  useGetRejectedExecutionsQuery ,
  useUpdateRejectedExecutionMutation

} = teamApiInjection;