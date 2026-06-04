import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import {
  Box,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import React from "react";
import { getDashboardCardSx, getDashboardDividerSx } from "./dashboardStyles";

const CardViewContract = ({
  loading,
  data = { aktif: 0, nonaktif: 0, expired: 0 },
}) => {
  const theme = useTheme();
  const { themeMode } = useThemeMode();

  return (
    <Paper
      elevation={0}
      sx={getDashboardCardSx(theme, {
        p: { xs: 1.5, sm: 2 },
        minHeight: "200px",
      })}
    >
      <Grid container spacing={1}>
        {/* Header */}
        {loading ? (
          <Skeleton
            variant="rounded"
            width="100%"
            height={20}
            animation="wave"
          />
        ) : (
          <Grid size={12}>
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: "bold",
                fontFamily: "poppins",
              }}
            >
              Jumlah Kontrak
            </Typography>
          </Grid>
        )}

        {loading ? undefined : (
          <Divider
            sx={getDashboardDividerSx(theme, {
              mt: "-5px",
              mb: 1,
            })}
          />
        )}

        {/* Content */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              width: "100%",
              height: "100%",
              mt: 1,
            }}
          >
            <Skeleton
              variant="rounded"
              width="33%"
              height={105}
              animation="wave"
            />
            <Skeleton
              variant="rounded"
              width="33%"
              height={105}
              animation="wave"
            />
            <Skeleton
              variant="rounded"
              width="33%"
              height={105}
              animation="wave"
            />
          </Box>
        ) : (
          <Grid
            container
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
            sx={{
              textAlign: "center",
            }}
            size={12}
          >
            {/* Aktif */}
            <Grid size={4}>
              <Box
                sx={{
                  background:
                    themeMode === "dark"
                      ? "rgba(0, 200, 0, 0.15)"
                      : "rgba(0, 200, 0, 0.1)",
                  borderRadius: 2,
                  p: 1.5,
                  minHeight: "120px",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: "0 0 10px rgba(0,255,0,0.3)",
                  },
                }}
              >
                <Icon
                  icon="mdi:check-decagram"
                  fontSize={35}
                  color="#4CAF50"
                  style={{ marginBottom: 5 }}
                />
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    fontFamily: "poppins",
                    color: "#4CAF50",
                  }}
                >
                  Aktif
                </Typography>
                <Typography
                  sx={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    fontFamily: "poppins",
                  }}
                >
                  {data.active ?? 0}
                </Typography>
              </Box>
            </Grid>

            {/* Nonaktif */}
            <Grid size={4}>
              <Box
                sx={{
                  background:
                    themeMode === "dark"
                      ? "rgba(255, 0, 0, 0.15)"
                      : "rgba(255, 0, 0, 0.1)",
                  borderRadius: 2,
                  p: 1.5,
                  minHeight: "120px",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: "0 0 10px rgba(255,0,0,0.3)",
                  },
                }}
              >
                <Icon
                  icon="mdi:close-octagon"
                  fontSize={35}
                  color="#FF5252"
                  style={{ marginBottom: 5 }}
                />
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    fontFamily: "poppins",
                    color: "#FF5252",
                  }}
                >
                  Non-Aktif
                </Typography>
                <Typography
                  sx={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    fontFamily: "poppins",
                  }}
                >
                  {data.non_active ?? 0}
                </Typography>
              </Box>
            </Grid>

            {/* Kadaluwarsa */}
            <Grid size={4}>
              <Box
                sx={{
                  background:
                    themeMode === "dark"
                      ? "rgba(255, 193, 7, 0.15)" // kuning amber redup untuk dark mode
                      : "rgba(255, 193, 7, 0.1)", // lembut untuk light mode
                  borderRadius: 2,
                  p: 1.5,
                  minHeight: "120px",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: "0 0 10px rgba(255, 193, 7, 0.3)",
                  },
                }}
              >
                <Icon
                  icon="mdi:clock-alert"
                  fontSize={35}
                  color="#FFC107" // warna kuning amber utama
                  style={{ marginBottom: 5 }}
                />
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    fontFamily: "poppins",
                    color: "#FFC107",
                  }}
                >
                  Kadaluwarsa
                </Typography>
                <Typography
                  sx={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    fontFamily: "poppins",
                  }}
                >
                  {data.expired ?? 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default CardViewContract;
