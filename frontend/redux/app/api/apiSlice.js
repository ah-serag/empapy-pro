
"use client";

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';



const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
});


const baseQueryWithReauth = async (args, api, extraOptions) => {

  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    console.log('sending refresh token');
    const refreshResult = await baseQuery('/api/auth/refresh', api, extraOptions);
    if (refreshResult?.data) {
      const { accessToken } = refreshResult.data;
      Cookies.set('accessToken', accessToken);
      result = await baseQuery(args, api, extraOptions);
    } else {
      if (refreshResult?.error?.status === 403) {
        refreshResult.error.data.message = 'Access denied';

      }
      return refreshResult;
    }
  }
  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Zones" , "Categories"  ,"Invoices" ,  "Services" ,"Governorates" , "Users" ,"Teams" , "Account" , 'Booking' , "Notifications" ,"Assignments"
     ,"DashboardBooking" , "DashboardUsers" ,"DashboardTeams" , "DashboardAssignments" , "DashboardInvoices" ,"DashboardFinancial" , "DashboardToday"
     , 'MaterialCategories', 'Materials', 'Inventory', 'Serials' ,"ExplorerLevel" , "DashboardStats" , "JobExecutions" , "Safes" , "Accounts" , "InventoryTransactions" ,"Suppliers" ,
     "TreasuryTransactions" , "PurchaseInvoices" , "Collections"  , "Expenses" , "Vouchers" , "TechnicianProfiles" , "Advance" ,"TechnicianEarnings" , "PendingSettlements" , "CollectionsDash" , "ExpensesDash" ,"SupplierTransactions"
  ],
  endpoints: () => ({})

});




