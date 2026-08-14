"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import useSWR, { KeyedMutator } from "swr";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Session } from "@/types/session";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { isRememberedAccountProvider } from "@/types/auth/rememberedAccount";
import { upsertRememberedAccount } from "@/utils/auth/rememberedAccounts";

interface UserContextType {
  user: Session | null;
  isLoading: boolean;
  error: Error | undefined;
  refresh: KeyedMutator<{ user: Session }>;
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

export const UserProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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
  } = useSWR<{ user: Session }>(
    // fbUser.uidをキーに含め、Firebase Authの単一インスタンス上でアカウントを
    // 切り替えた際（URL文字列自体は変わらない）にもSWRが再フェッチするようにする
    fbUser ? `${API_PREFIX}/me?uid=${fbUser.uid}` : null,
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  const combinedLoading =
    isInitializing || (!!fbUser && isSwrLoading && !data && !error);

  const recordedUidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!fbUser || !data?.user) return;
    const providerId = fbUser.providerData[0]?.providerId;
    if (!isRememberedAccountProvider(providerId)) return;

    const isNewSignIn = recordedUidRef.current !== fbUser.uid;
    recordedUidRef.current = fbUser.uid;

    upsertRememberedAccount(
      {
        uid: fbUser.uid,
        displayName: data.user.userName || fbUser.displayName || "",
        avatarUrl: data.user.profileImage || fbUser.photoURL || "",
        provider: providerId,
        isPublic: !!data.user.isPublic,
      },
      { bumpLastSwitchedAt: isNewSignIn },
    );
  }, [fbUser, data?.user]);

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
