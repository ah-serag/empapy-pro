import { apiSlice } from "../app/api/apiSlice";

export const notificationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUnreadNotifications: builder.query({
      query: () => "/api/notifications/unread",
      providesTags: ["Notifications"],
    }),
    
    getAllNotifications: builder.query({
      query: ({ page = 1, limit = 10, is_read  }) => 
        `/api/notifications?page=${page}&limit=${limit}&is_read=${is_read}`,
      providesTags: ["Notifications"], 
    }),
    
    markAsRead: builder.mutation({
      query: (body) => ({
        url: "/api/notifications/read",
        method: "PUT",
        body, 
      }),
      invalidatesTags: ["Notifications"], 
    }),



    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `api/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),

    deleteAllNotifications: builder.mutation({
      query: () => ({
        url: `api/notifications/all`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const { 
  useGetUnreadNotificationsQuery,
  useGetAllNotificationsQuery,
  useMarkAsReadMutation ,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation
} = notificationApiSlice;