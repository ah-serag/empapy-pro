import { apiSlice } from '../app/api/apiSlice';

export const bookingsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // 1. Get Advanced Bookings (With Query Params)
    getAdvancedBookings: builder.query({
      query: (params) => ({
        url: `/api/booking`,
        method: 'GET',
        params: params, 
      }),
      providesTags: ['Booking'],
    }),

    // 2. Get Single Booking by ID
    getBookingById: builder.query({
      query: (id) => `/api/booking/${id}`,
      providesTags:['Booking'],
    }),

    createBooking: builder.mutation({
      query: (bookingData) => ({
        url: `/api/booking`,
        method: 'POST',
        body: bookingData,
      }),
      invalidatesTags: ['Booking'], 
    }),

    // 4. Confirm Booking
    confirmBooking: builder.mutation({
      query: ({ id, confirmed_by }) => ({
        url: `/api/booking/${id}/confirm`, 
        method: 'PUT',
        body: { confirmed_by },
      }),
      invalidatesTags: ['Booking'],
    }),

    cancelBooking: builder.mutation({
      query: ({ id, cancelled_reason }) => ({
        url: `/api/booking/${id}/cancel`, 
        method: 'PUT',
        body: { cancelled_reason },
      }),
      invalidatesTags: ['Booking'],
    }),

    updateBookingStatus: builder.mutation({
      query: ({ id, status, payment_status }) => ({
        url: `/api/booking/${id}/status`,
        method: 'PUT',
        body: { status, payment_status },
      }),
      invalidatesTags: ['Booking'],
    }),

    deleteBooking: builder.mutation({
      query: (id) => ({
        url: `/api/booking/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Booking'],
    }),

updateBookingLocation: builder.mutation({
      query: ({ id, location_url }) => ({
        url: `/api/booking/${id}/location`,
        method: 'PUT',
        body: { location_url },
      }),
      invalidatesTags: ['Booking'], 
    }),



  }),
});

export const {
  useGetAdvancedBookingsQuery,
  useGetBookingByIdQuery,
  useCreateBookingMutation,
  useConfirmBookingMutation,
  useCancelBookingMutation,
  useUpdateBookingStatusMutation,
  useDeleteBookingMutation,
  useUpdateBookingLocationMutation
} = bookingsApiSlice;