import { apiSlice } from "../app/api/apiSlice";
import { setUser } from "./systemAuth";

export const accoubtapiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({




getUserAccountInfo: builder.query({

   query: () => ({
        url: "/api/account/info", 
        method: "GET",
      }),
    async onQueryStarted(arg, { dispatch, queryFulfilled }) {
    try {

      const { data } = await queryFulfilled;

      dispatch(setUser(data.data));

    } catch (err) {}

  },
      providesTags: ["Account", "Users"],
    }) 



 }) ,


});

export const {
useGetUserAccountInfoQuery ,
useLazyGetUserAccountInfoQuery
} = accoubtapiSlice;