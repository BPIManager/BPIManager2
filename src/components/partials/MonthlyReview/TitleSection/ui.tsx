"use client";

import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const styles = `
  @keyframes titleDrop  { from{opacity:0;transform:translateY(-40px) scale(1.1)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes subSlide   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scrollPulse{ 0%,100%{opacity:0.2;transform:translateY(0)} 50%{opacity:0.6;transform:translateY(6px)} }
  @keyframes lineExpand { from{width:0} to{width:min(200px,40vw)} }
  @keyframes userFade   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
`;

interface Props {
  periodLabel: string;
  diffColor: string;
  subtitle: string;
  inView: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
  userId: string | undefined;
  userName: string | null;
  profileImage: string | null;
}

export const TitleSectionUI = ({
  periodLabel,
  diffColor,
  subtitle,
  inView,
  sectionRef,
  userId,
  userName,
  profileImage,
}: Props) => (
  <>
    <style>{styles}</style>
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full flex-col items-center justify-center px-6"
    >
      {userId && userName && (
        <Link
          href={`/users/${userId}`}
          className="mb-6 flex items-center gap-2.5 rounded-full px-4 py-2 transition-all hover:scale-105"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            animation: inView ? "userFade 0.6s ease-out 0.05s both" : "none",
          }}
        >
          <Avatar size="sm">
            <AvatarImage src={profileImage ?? undefined} alt={userName} />
            <AvatarFallback
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {userName.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span
            className="text-sm font-semibold"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            {userName}
          </span>
        </Link>
      )}

      <h1
        className="text-center font-black leading-none"
        style={{
          fontSize: "clamp(3rem, 14vw, 10rem)",
          color: "rgba(255,255,255,0.92)",
          textShadow: "0 0 120px rgba(255,255,255,0.08)",
          animation: inView
            ? "titleDrop 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s both"
            : "none",
        }}
      >
        {periodLabel}
      </h1>

      <div
        className="my-8 h-px"
        style={{
          width: "min(200px,40vw)",
          background: "rgba(255,255,255,0.15)",
          animation: inView ? "lineExpand 0.8s ease-out 0.5s both" : "none",
        }}
      />

      <p
        className="text-center font-semibold"
        style={{
          fontSize: "clamp(0.9rem, 2.5vw, 1.4rem)",
          color: diffColor,
          textShadow: `0 0 40px ${diffColor}44`,
          animation: inView ? "subSlide 0.6s ease-out 0.6s both" : "none",
        }}
      >
        {subtitle}
      </p>
    </section>
  </>
);
