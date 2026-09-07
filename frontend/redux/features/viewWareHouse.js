import { apiSlice } from "../app/api/apiSlice";




export const explorerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExplorerLevel: builder.query({
      query: (categoryId) => {
        let url = '/api/wareHouse/explorer';
        if (categoryId && categoryId !== 'null') {
          url += `?categoryId=${categoryId}`; 
        }
        return { url };
      },
      providesTags: (result, error, arg) => [
        { type: 'ExplorerLevel', id: arg || 'ROOT' }
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetExplorerLevelQuery,
} = explorerApiSlice;