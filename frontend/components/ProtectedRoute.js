"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // loading khatam hone ke baad hi check karo
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading]);

  // Token check ho raha hai — kuch mat dikhao
  if (loading) return null;

  // Token check ho gaya, user nahi hai — kuch mat dikhao (redirect hoga)
  if (!user) return null;

  // User hai — page dikhao
  return children;
}