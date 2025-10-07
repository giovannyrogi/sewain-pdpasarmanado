import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import {
  Box,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React from "react";

const CardViewContract = ({
  loading,
  data = { aktif: 0, nonaktif: 0, expired: 0 },
}) => {
  const theme = useTheme();
  const { themeMode } = useThemeMode();
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <Paper
      elevation={6}
      sx={{
        backgroundColor: "background.default",
        p: 2,
        height: "180px",
        borderRadius: "15px",
        // "&:hover": {
        //   boxShadow: 15,
        //   transition: "all 0.2s ease",
        //   border:
        //     themeMode === "dark"
        //       ? `solid 1px ${theme.palette.primary.main}`
        //       : "unset",
        // },
      }}
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
              Daftar Kontrak
            </Typography>
          </Grid>
        )}

        {loading ? undefined : (
          <Divider
            sx={{
              // borderWidth: "1px",
              borderColor: theme.palette.primary.main,
              // mt: 1,
              width: "100%",
              mt: "-5px",
              mb: 1,
            }}
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
                  borderRadius: "12px",
                  p: 1.5,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: "0 0 10px rgba(0,255,0,0.3)",
                  },
                }}
              >
                <Icon
                  icon="mdi:check-decagram"
                  fontSize={30}
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
                    fontSize: "16px",
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
                  borderRadius: "12px",
                  p: 1.5,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: "0 0 10px rgba(255,0,0,0.3)",
                  },
                }}
              >
                <Icon
                  icon="mdi:close-octagon"
                  fontSize={30}
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
                    fontSize: "16px",
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
                  borderRadius: "12px",
                  p: 1.5,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: "0 0 10px rgba(255, 193, 7, 0.3)",
                  },
                }}
              >
                <Icon
                  icon="mdi:clock-alert"
                  fontSize={30}
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
                    fontSize: "16px",
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
