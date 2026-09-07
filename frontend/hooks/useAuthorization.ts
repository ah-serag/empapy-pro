"use client";

import { useSelector } from "react-redux";

export type Role =
  | "admin" 
  | "superadmin"
  | "supervisor"
  | "technician";

export function useAuthorization() {

  const user = useSelector(
    (state:any) => state.auth.user
  );
   
  const initialized = useSelector(
    (state: any) => state.auth.initialized
  );



  const isLoading = useSelector(
    (state : any) => state.auth.isLoading
  );

  const role = user?.role as Role | undefined;
  
  
  const isAuthenticated = !!user;


  const hasRole = (roleName: Role) => {

    return role === roleName;

  };

  const hasAnyRole = (
    roles: Role[]
  ) => {

    return role
      ? roles.includes(role)
      : false;

  };

  return {

    user,

    role,

    isLoading,

    isAuthenticated,

    initialized,


    isAdmin: role === "admin",

    isManager: role === "superadmin",

    isSupervisor: role === "supervisor",

    isTechnician: role === "technician",

    hasRole,

    hasAnyRole,

  };

}