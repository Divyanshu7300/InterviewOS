"use client";

import Image from "next/image";

const AVATAR_OPTIONS = [
  "/avatars/character-1.svg",
  "/avatars/character-2.svg",
  "/avatars/character-3.svg",
  "/avatars/character-4.svg",
  "/avatars/character-5.svg",
  "/avatars/character-6.svg",
];

const SIZE_CLASSES = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-16 w-16",
};

function hashName(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export default function UserAvatar({ name, size = "md", className = "" }) {
  const resolvedSize = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const avatarSrc = AVATAR_OPTIONS[hashName(name || "guest") % AVATAR_OPTIONS.length];

  return (
    <div
      className={`relative overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] ${resolvedSize} ${className}`}
    >
      <Image
        src={avatarSrc}
        alt={`${name || "User"} avatar`}
        fill
        sizes="64px"
        className="object-cover"
      />
    </div>
  );
}
