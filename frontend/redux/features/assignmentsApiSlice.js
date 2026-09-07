import { apiSlice } from "../app/api/apiSlice";

export const assignmentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getAssignments: builder.query({
      query: (params) => ({
        url: "/api/assignments",
        method: "GET",
        params,
      }),
      providesTags: ["Assignments"],
    }),

    getAssignmentById: builder.query({
      query: (id) => ({
        url: `/api/assignments/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "Assignments", id },
      ],
    }),


    

    createAssignment: builder.mutation({
      query: (data) => ({
        url: "/api/assignments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Assignments" , "Booking"],
    }),




   Assignmentcancel: builder.mutation({
      query: ({ id, status  , cancel_reason , cancel_booking }) => ({
        url: "/api/assignments/cancel", 
        method: "post",
        body: { id, status , cancel_reason , cancel_booking },
      }),
      invalidatesTags: ["Assignments" , "Booking"]
    }),
         
     getAssignmentsMembers: builder.query({
      query: (params) => ({
        url: `/api/assignments/${params}/assignment-Members`,
        method: "GET",
      }),
    }),









  }),
});

export const {
  useGetAssignmentsQuery,
  useGetAssignmentByIdQuery,
  useCreateAssignmentMutation,
  useGetAssignmentsMembersQuery ,
  useAssignmentcancelMutation
} = assignmentApiSlice;