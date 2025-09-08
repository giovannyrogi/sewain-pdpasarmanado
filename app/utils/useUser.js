"use client";
import { useEffect, useState } from "react";
import { getCookie } from "../utils/cookies";

export const useUser = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loggedInUser = getCookie("loggedInUser");
    if (loggedInUser) {
      try {
        setUser(JSON.parse(loggedInUser));
      } catch (err) {
        console.error("Error parsing loggedInUser cookie:", err);
      }
    }
  }, []);

  return user;
};
