import { UserProfileData } from "@/types/users/profile";
import { createContext, useContext, ReactNode } from "react";

interface ProfileContextValue {
  profile: UserProfileData;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

export const ProfileProvider = ({
  profile,
  children,
}: {
  profile: UserProfileData;
  children: ReactNode;
}) => {
  return (
    <ProfileContext.Provider value={{ profile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useStaticProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useStaticProfile must be used within a ProfileProvider");
  }
  return context;
};
