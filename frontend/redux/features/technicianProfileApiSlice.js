import { apiSlice } from "../app/api/apiSlice";

export const technicianProfileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    getTechnicianProfiles: builder.query({
      query: () => "/api/finance/technician-profiles",
      providesTags: ["TechnicianProfiles"],
    }),

    upsertTechnicianProfile: builder.mutation({
      query: (data) => ({
        url: "/api/finance/technician-profiles",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["TechnicianProfiles"], 
    }),

  }),
});

export const {
  useGetTechnicianProfilesQuery,
  useUpsertTechnicianProfileMutation,
} = technicianProfileApiSlice;