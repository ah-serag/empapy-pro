import { apiSlice } from "../app/api/apiSlice";

export const technicianEarningsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTechnicianEarnings: builder.query({
      query: (params) => {
        const queryString = new URLSearchParams();
        if (params.search) queryString.append('search', params.search);
        if (params.status && params.status !== 'all') queryString.append('status', params.status);
        if (params.start_date) queryString.append('start_date', params.start_date);
        if (params.end_date) queryString.append('end_date', params.end_date);
        if (params.page) queryString.append('page', params.page);
        if (params.limit) queryString.append('limit', params.limit);

        return `/api/technician-earnings?${queryString.toString()}`;
      },
      providesTags: ["TechnicianEarnings"],
    }),

    approveTechnicianEarning: builder.mutation({
      query: (id) => ({
        url: `/api/technician-earnings/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["TechnicianEarnings" , "PendingSettlements"],
    }),

    cancelTechnicianEarning: builder.mutation({
      query: (id) => ({
        url: `/api/technician-earnings/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: ["TechnicianEarnings"],
    }),

   getPendingSettlements: builder.query({
      query: (technician_id) => `/api/technician-earnings/settlements/${technician_id}`,
      providesTags: ["PendingSettlements"],
    }),

    executeSettlement: builder.mutation({
      query: (data) => ({
        url: `/api/technician-earnings/settlements`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["TechnicianEarnings" , "PendingSettlements"],
    }),

getSettlementsHistory: builder.query({
      query: (params) => {
        const queryString = new URLSearchParams();
        if (params.search) queryString.append('search', params.search);
        if (params.start_date) queryString.append('start_date', params.start_date);
        if (params.end_date) queryString.append('end_date', params.end_date);
        if (params.page) queryString.append('page', params.page.toString());
        if (params.limit) queryString.append('limit', params.limit.toString());

        return `/api/technician-earnings/settlements-history?${queryString.toString()}`;
      },
      providesTags: ["TechnicianEarnings"],
    }),

  }),
});

export const { useGetTechnicianEarningsQuery ,useApproveTechnicianEarningMutation , useGetSettlementsHistoryQuery , useCancelTechnicianEarningMutation ,useGetPendingSettlementsQuery ,useExecuteSettlementMutation} = technicianEarningsApiSlice;