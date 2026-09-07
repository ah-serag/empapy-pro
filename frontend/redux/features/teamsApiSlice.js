import { apiSlice } from "../app/api/apiSlice";

export const teamsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    getTeams: builder.query({
      query: ({ search, team_type, is_active, zone_id, governorate_id, page = 1, limit = 10 }) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (team_type && team_type !== "all") params.append("team_type", team_type);
        if (is_active && is_active !== "all") params.append("is_active", is_active);
        if (zone_id && zone_id !== "0") params.append("zone_id", zone_id);
        if (governorate_id && governorate_id !== "0") params.append("governorate_id", governorate_id);
        params.append("page", page);
        params.append("limit", limit);
        return `/api/teams?${params.toString()}`;
      },
      providesTags: ["Teams"],
    }),

    getTeamById: builder.query({
      query: (id) => `/api/teams/${id}`,
      providesTags: (result, error, id) => [{ type: "Teams", id }, "Teams"],
    }),

    createTeam: builder.mutation({
      query: (data) => ({ 
        url: "/api/teams", 
        method: "POST", 
        body: data 
      }),
      invalidatesTags: ["Teams"],
    }),

updateTeamStatus: builder.mutation({
  query: ({ id, is_active }) => ({
    url: `/api/teams/${id}/status`,
    method: "PATCH",
    body: { is_active },
  }),
  invalidatesTags: ["Teams"], 
}),



    updateTeam: builder.mutation({
      query: ({ id, data }) => ({ 
        url: `/api/teams/${id}`, 
        method: "PUT", 
        body: data 
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Teams", id }, "Teams"],
    }),

    deleteTeam: builder.mutation({
      query: (id) => ({ 
        url: `/api/teams/${id}`, 
        method: "DELETE" 
      }),
      invalidatesTags: ["Teams"],
    }),

    addTeamMember: builder.mutation({
      query: ({ teamId, data }) => ({
        url: `/api/teams/${teamId}/members`,
        method: "POST",
        body: data,
      }),
      // التعديل السحري هنا: ضربنا التاج الخاص بالمودال + التاج العام للجدول
      invalidatesTags: (result, error, { teamId }) => [{ type: "Teams", id: teamId }, "Teams"],
    }),

    removeTeamMember: builder.mutation({
      query: ({ teamId, memberId }) => ({
        url: `/api/teams/${teamId}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { teamId }) => [{ type: "Teams", id: teamId }, "Teams"],
    }),

    getTeamsSelector: builder.query({
      query: () => ({
        url: "/api/teams/getTeamsSelector", 
        method: "GET",
      }),
      providesTags: ["Teams"],
    }),


  }),
});

export const {
  useGetTeamsQuery,
  useGetTeamByIdQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useGetTeamsSelectorQuery ,
  useUpdateTeamStatusMutation
} = teamsApiSlice;