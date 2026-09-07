"use client";

import { ReactNode, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useGetUserAccountInfoQuery } from "@/redux/features/account"; 
import { setUser, finishInitialization } from "@/redux/features/systemAuth";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isError, isSuccess } = useGetUserAccountInfoQuery(undefined);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isSuccess && data?.success) {
      dispatch(setUser(data.data));
      dispatch(finishInitialization()); 
    }

    if (isError) {
      dispatch(finishInitialization());
    }
  }, [isSuccess, isError, data, dispatch]);

  return <>{children}</>;
}