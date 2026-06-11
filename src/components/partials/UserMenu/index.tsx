"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronRight } from "lucide-react";

import { useUser } from "@/contexts/users/UserContext";
import { authActions } from "@/lib/firebase/auth";
import { useTranslation } from "@/hooks/common/useTranslation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { RoleBadge } from "../UserRole/badge";
import AccountSettings from "../Modal/AccountSettings";
import { LoginDialog } from "../LoginRequired/LoginDialog";

type MenuItemProps = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

const MenuItem = ({ label, onClick, danger = false }: MenuItemProps) => (
  <button
    onClick={onClick}
    className={`
      group flex w-full cursor-pointer items-center justify-between
      rounded-md px-3 py-1.5 text-xs transition-all duration-150
      ${
        danger
          ? "font-bold text-bpim-danger hover:bg-bpim-danger/10"
          : "font-normal text-bpim-text hover:bg-bpim-overlay"
      }
    `}
  >
    <span>{label}</span>
    <ChevronRight className="h-3 w-3 opacity-40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:opacity-80" />
  </button>
);

export const UserMenu = () => {
  const { user, isLoading } = useUser();
  const { t } = useTranslation();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const router = useRouter();
  const close = () => setPopoverOpen(false);
  const navigate = (path: string) => {
    close();
    router.push(path);
  };

  if (!isLoading && !user) {
    return (
      <>
        <Button size="sm" onClick={() => setLoginDialogOpen(true)}>
          {t("nav.signIn")}
        </Button>
        <LoginDialog
          isOpen={loginDialogOpen}
          onClose={() => setLoginDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button className="cursor-pointer rounded-full outline-none ring-offset-2 ring-offset-bpim-surface focus-visible:ring-2 focus-visible:ring-bpim-primary">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.profileImage || ""}
                alt={user?.userName || "User"}
              />
              <AvatarFallback className="bg-bpim-overlay text-bpim-text text-xs">
                {user?.userName?.slice(0, 2) || "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-52 p-0 overflow-hidden"
        >
          <div className="bg-bpim-overlay/60 px-4 py-3 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-bold text-bpim-text">
                {user?.userName || "Guest"}
              </p>
              {user?.role && (
                <RoleBadge {...user.role} variant="full" size="small" />
              )}
            </div>
            <p className="font-mono text-[11px] font-semibold text-bpim-warning">
              ☆12 BPI {user?.totalBpi ?? -15}
            </p>
          </div>

          {user?.userId && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-bpim-border">
              <Link
                href={`/users/${user.userId}/following`}
                onClick={close}
                className="group flex items-baseline gap-1 cursor-pointer"
              >
                <span className="text-xs font-bold text-bpim-text group-hover:text-bpim-primary transition-colors">
                  {user.followingCount ?? 0}
                </span>
                <span className="text-[10px] text-bpim-text-muted group-hover:text-bpim-text transition-colors">
                  {t("nav.user.following")}
                </span>
              </Link>
              <span className="text-bpim-border text-xs select-none">·</span>
              <Link
                href={`/users/${user.userId}/followers`}
                onClick={close}
                className="group flex items-baseline gap-1 cursor-pointer"
              >
                <span className="text-xs font-bold text-bpim-text group-hover:text-bpim-primary transition-colors">
                  {user.followerCount ?? 0}
                </span>
                <span className="text-[10px] text-bpim-text-muted group-hover:text-bpim-text transition-colors">
                  {t("nav.user.followers")}
                </span>
              </Link>
            </div>
          )}

          <div className="flex flex-col p-1">
            {user?.userId && (
              <MenuItem
                label={t("nav.user.viewProfile")}
                onClick={() => {
                  close();
                  navigate(`/users/${user.userId}`);
                }}
              />
            )}
            <MenuItem
              label={t("settings.profile.title")}
              onClick={() => {
                close();
                setAccountSettingsOpen(true);
              }}
            />
            <MenuItem
              label={t("nav.settings")}
              onClick={() => {
                close();
                navigate("/settings");
              }}
            />

            <Separator className="bg-bpim-border my-1" />

            <MenuItem
              label={t("nav.signOut")}
              onClick={() => authActions.logout()}
              danger
            />
          </div>
        </PopoverContent>
      </Popover>

      <AccountSettings
        isOpen={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
      />
    </>
  );
};
