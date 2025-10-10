"use client";
import React, { useEffect, useState, useMemo } from "react";
import moment from "moment";
import "moment/locale/id"; // bahasa Indonesia
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import {
  Box,
  Grid,
  Paper,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Image from "next/image";

moment.locale("id");

const WelcomeCard = ({ user, loading, isMobile, isTablet }) => {
  const theme = useTheme();
  const { themeMode } = useThemeMode();

  const [currentTime, setCurrentTime] = useState(null);
  const [mounted, setMounted] = useState(false);

  // selalu daftarkan hooks dulu — effect untuk waktu berjalan
  useEffect(() => {
    setMounted(true);
    setCurrentTime(moment());

    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // fallback agar hook/hitungannya tetap terpanggil walau currentTime belum ada
  const safeTime = currentTime || moment();

  const greeting = useMemo(() => {
    const hour = safeTime.hour();
    if (hour >= 4 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
  }, [safeTime]);

  const formattedDate = useMemo(
    () => safeTime.format("dddd, D MMMM YYYY"),
    [safeTime]
  );
  const formattedTime = useMemo(() => safeTime.format("HH:mm:ss"), [safeTime]);

  // jika belum mounted tampilkan skeleton (tidak men-conditional-kan hooks)
  if (!mounted) {
    return (
      <Paper
        elevation={6}
        sx={{
          backgroundColor: "background.default",
          p: 2,
          height: "200px",
          borderRadius: "15px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Skeleton variant="rounded" width="80%" height={80} animation="wave" />
      </Paper>
    );
  }

  return (
    <Paper
      elevation={6}
      sx={{
        backgroundColor: "background.default",
        p: 2,
        height: isMobile ? "350px" : "250px",
        borderRadius: "15px",
        transition: "all 0.2s ease",
      }}
    >
      {loading ? (
        <Skeleton variant="rounded" width="80%" height={100} animation="wave" />
      ) : (
        <Grid container spacing={1}>
          <Grid container size={isMobile ? 12 : isTablet ? 6 : 8} spacing={1}>
            <Grid size={12}>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  textTransform: "capitalize",
                }}
              >
                {`${greeting}, ${user?.full_name ?? "Pengguna"}`}!
              </Typography>

              <Typography
                variant="subtitle1"
                sx={{
                  color:
                    themeMode === "dark"
                      ? theme.palette.text.secondary
                      : theme.palette.text.primary,
                  textTransform: "capitalize",
                }}
              >
                {`Sekarang hari ${formattedDate}`}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  color:
                    themeMode === "dark"
                      ? theme.palette.text.secondary
                      : theme.palette.text.primary,
                  textTransform: "capitalize",
                }}
              >
                waktu saat ini{" "}
                <span
                  style={{
                    color: theme.palette.primary.main,
                    fontWeight: "bold",
                  }}
                >
                  {formattedTime}
                </span>{" "}
              </Typography>
            </Grid>
          </Grid>

          <Grid
            container
            size={isMobile ? 12 : isTablet ? 6 : 4}
            align={isMobile ? "center" : "right"}
          >
            <Grid size={12}>
              <Image
                src={
                  themeMode === "dark"
                    ? "/working-dark.png"
                    : "/working-light.png"
                }
                alt="logo"
                width={300}
                height={300}
                style={{
                  objectFit: "contain",
                  position: "relative",
                  top: -60,
                  right: -20,
                  transition: "all 0.2s ease",
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default WelcomeCard;
