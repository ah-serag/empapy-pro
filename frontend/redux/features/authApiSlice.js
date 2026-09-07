import { apiSlice } from "../app/api/apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    register: builder.mutation({
      query: (userData) => ({
        url: "/api/auth/register",
        method: "POST",
        body: userData,
        invalidatesTags:  ["Account" ,"Users" ] 
      }),
    }),

    signIn: builder.mutation({
      query: (credentials) => ({
        url: "/api/auth/sign_in",
        method: "POST",
        body: credentials,
        invalidatesTags:  ["Account"] 

      }),
    }),

    logOut: builder.mutation({
      query: () => ({
        url: "/api/auth/logout",
        method: "POST",
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          dispatch(apiSlice.util.resetApiState());
        } catch (err) {
          console.error("Logout failed", err);
        }
      },
    }),

    createTeamMember: builder.mutation({
      query: (newMemberData) => ({
        url: "/api/auth/createTeamMember",
        method: "POST",
        body: newMemberData,
      }),
      invalidatesTags:  ["Teams" , "Users"] 
      
    }),


    getUsers: builder.query({
  query: ({ search, role, is_active, page, limit, sort_by, order }) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (role && role !== "all") params.append("role", role);
    if (is_active && is_active !== "all") params.append("is_active", is_active);
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (sort_by) params.append("sort_by", sort_by);
    if (order) params.append("order", order);

    return `/api/auth/users?${params.toString()}`;
  },
  providesTags: ["Users"],
}),



toggleUserStatus: builder.mutation({
  query: ({ id, is_active }) => ({
    url: `/api/auth/users/${id}/status`,
    method: "PATCH",
    body: { is_active },
  }),
  invalidatesTags: ["Users"],
}),

deleteUser: builder.mutation({
  query: (id) => ({
    url: `/api/auth/users/${id}`,
    method: "DELETE",
  }),
  invalidatesTags: ["Users"],
}),


getUsersList: builder.query({
      query: (role) => `/api/auth/users-list?role=${role}`,
      providesTags: ["Users"],
    }),

  }),









});

export const {
  useRegisterMutation,
  useSignInMutation,
  useLogOutMutation,
  useCreateTeamMemberMutation,
useGetUsersQuery  ,
useDeleteUserMutation ,
useToggleUserStatusMutation ,
useGetUsersListQuery

} = authApiSlice;