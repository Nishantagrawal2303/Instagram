import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",

  baseQuery: fetchBaseQuery({
   baseUrl: "/",
    credentials: "include",
   
  }),
 tagTypes: ["Posts", "Comments","Profile","Follow","Conversation",],
  endpoints: () => ({}),
});
