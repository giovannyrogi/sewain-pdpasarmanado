"use client";
import { ThemeModeProvider } from "../themeprovider/ThemeContext";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import "moment/locale/id";
import { useRouter } from "next/navigation";
import ExpiredSessionModal from "../expiredsessionmodal/page";
import { useEffect, useState } from "react";
moment.locale("id");

const SESSION_CHECK_INTERVAL = 1000; // cek tiap 1 detik
const SESSION_MODAL_COUNTDOWN = 10; // 10 detik countdown manual

export default function AppProviders({ children }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [counter, setCounter] = useState(SESSION_MODAL_COUNTDOWN);

  const getCookie = (name) => {
    const match = document.cookie.match(
      new RegExp("(^| )" + name + "=([^;]+)")
    );
    return match ? decodeURIComponent(match[2]) : null;
  };

  // --- interval global untuk cek session tiap detik
  useEffect(() => {
    const interval = setInterval(() => {
      const cookie = getCookie("loggedInUser");
      if (!cookie) return;

      let user;
      try {
        user = JSON.parse(cookie);
      } catch (err) {
        console.error(err);
        return;
      }

      const now = Date.now();

      if (user.expiresAt <= now && !showModal) {
        // session expired → tampilkan modal & mulai countdown
        setShowModal(true);
        setCounter(SESSION_MODAL_COUNTDOWN);
      }
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [showModal]);

  // --- countdown modal 10 detik
  useEffect(() => {
    if (!showModal) return;

    if (counter <= 0) {
      // hapus cookie, tutup modal & redirect
      document.cookie =
        "loggedInUser=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setShowModal(false);
      router.push("/login");
      return;
    }

    const timer = setTimeout(() => {
      setCounter((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showModal, counter, router]);

  return (
    <ThemeModeProvider>
      <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="id">
        {children}
        <ExpiredSessionModal open={showModal} counter={counter} />
      </LocalizationProvider>
    </ThemeModeProvider>
  );
}
