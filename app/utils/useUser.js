"use client";
import { useEffect, useState } from "react";
import { getCookie } from "../utils/cookies";

export const useUser = () => {
  const [user, setUser] = useState(null);

  const syncFromCookie = () => {
    const loggedInUser = getCookie("loggedInUser");
    if (!loggedInUser) return;

    try {
      setUser(JSON.parse(loggedInUser));
    } catch (err) {
      console.error("Error parsing loggedInUser cookie:", err);
    }
  };

  useEffect(() => {
    // initial load
    syncFromCookie();

    // listen perubahan user
    const handler = (e) => {
      if (e?.detail) {
        setUser(e.detail);
      } else {
        syncFromCookie();
      }
    };

    window.addEventListener("user-cookie-updated", handler);

    return () => {
      window.removeEventListener("user-cookie-updated", handler);
    };
  }, []);

  return { user, setUser };
};
