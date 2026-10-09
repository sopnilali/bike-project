"use client";

import { useEffect, useState } from "react";
import { fetchProfilePhotoBlob } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProfilePhotoProps {
  userId: string;
  /** True when the user has a stored photo (user.photoUrl != null). */
  hasPhoto: boolean;
  /** Bump to force refetch after upload/delete (cache-busting). */
  version?: number;
  /** Display name or email used for the fallback initial. */
  label: string;
  className?: string;
}

/** Avatar that loads the protected photo blob, falling back to an initial. */
export function ProfilePhoto({
  userId,
  hasPhoto,
  version = 0,
  label,
  className,
}: ProfilePhotoProps) {
  const [loaded, setLoaded] = useState<{ key: string; url: string } | null>(
    null
  );
  const key = `${userId}:${hasPhoto ? "1" : "0"}:${version}`;

  useEffect(() => {
    if (!hasPhoto || !userId) return;
    const currentKey = key;
    let alive = true;
    let objectUrl: string | null = null;
    fetchProfilePhotoBlob(userId)
      .then((blob) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setLoaded({ key: currentKey, url: objectUrl });
      })
      .catch(() => {
        // Fallback initial stays visible; nothing to store.
      });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key, userId, hasPhoto, version]);

  const url = loaded && loaded.key === key ? loaded.url : null;

  const initial = (label || "S").trim().charAt(0).toUpperCase() || "S";

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="Profile photo"
        className={cn("rounded-full object-cover", className ?? "h-9 w-9")}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white",
        className ?? "h-9 w-9"
      )}
    >
      {initial}
    </span>
  );
}
