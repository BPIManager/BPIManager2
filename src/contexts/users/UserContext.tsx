"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import useSWR, { KeyedMutator } from "swr";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { User } from "@/types/sql";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: any;
  refresh: KeyedMutator<any>;
  fbUser: FirebaseUser | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const authenticatedFetcher = async (url: string) => {
  const token = await auth.currentUser?.getIdToken();

  if (!token) throw new Error("No firebase token found");

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch user data");
  }

  return res.json();
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const {
    data,
    error,
    isLoading: isSwrLoading,
    mutate,
  } = useSWR(fbUser ? "/api/users/me" : null, authenticatedFetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const combinedLoading =
    isInitializing || (!!fbUser && isSwrLoading && !data && !error);

  return (
    <UserContext.Provider
      value={{
        user: data?.user || null,
        isLoading: combinedLoading,
        error,
        refresh: mutate,
        fbUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
