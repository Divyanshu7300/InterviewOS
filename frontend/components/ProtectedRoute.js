"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only check auth after loading completes.
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Auth state is still loading.
  if (loading) return null;

  // User is not authenticated; redirect will handle navigation.
  if (!user) return null;

  // User is authenticated.
  return children;
}
