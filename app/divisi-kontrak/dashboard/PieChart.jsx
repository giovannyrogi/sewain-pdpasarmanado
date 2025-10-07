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
import { pieArcClasses, PieChart, pieClasses } from "@mui/x-charts";

const ViewPieChart = ({ loading, contractApprovalStatus }) => {
  const theme = useTheme();
  const { themeMode } = useThemeMode();
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <Paper
      elevation={6}
      sx={{
        backgroundColor: "background.default",
        p: 2,
        borderRadius: "15px",
        // height: "400px",
      }}
    >
      <Grid container spacing={1}>
        {/* Header */}
        {loading ? (
          <Skeleton variant="text" width="100%" height={30} animation="wave" />
        ) : (
          <Grid size={12}>
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: "bold",
                fontFamily: "poppins",
              }}
            >
              Status Persetujuan Kontrak
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

        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              width: "100%",
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Skeleton
              variant="circular"
              width={250}
              height={250}
              animation="wave"
            />
            <Skeleton variant="text" width="85%" height={30} animation="wave" />
          </Box>
        ) : (
          <Grid size={12}>
            <PieChart
              series={[
                {
                  data:
                    contractApprovalStatus.approved === 0 &&
                    contractApprovalStatus?.process === 0 &&
                    contractApprovalStatus?.rejected === 0
                      ? [
                          {
                            value: 1,
                            label: "Belum Ada Data (0)",
                            color: theme.palette.grey[400],
                          },
                        ]
                      : [
                          {
                            value: contractApprovalStatus.approved || 0,
                            label: `Disetujui (${
                              contractApprovalStatus.approved || 0
                            })`,
                            color: "#4caf50",
                          },
                          {
                            value: contractApprovalStatus.process || 0,
                            label: `Dalam Proses (${
                              contractApprovalStatus.process || 0
                            })`,
                            color: "#ffb300",
                          },
                          {
                            value: contractApprovalStatus.rejected || 0,
                            label: `Ditolak (${
                              contractApprovalStatus.rejected || 0
                            })`,
                            color: "#f44336",
                          },
                        ],
                  highlightScope: { faded: "global", highlighted: "item" },
                  faded: {
                    innerRadius: 30,
                    additionalRadius: -10,
                    color: "gray",
                  },
                  //valueFormatter supaya tooltip tidak menampilkan angka otomatis
                  valueFormatter: (value, context) => {
                    // return null atau "" untuk menyembunyikan nilai default
                    return "";
                  },
                },
              ]}
              width={250}
              height={250}
              slotProps={{
                tooltip: {
                  trigger: "item",
                },
                legend: {
                  direction: "row", // horizontal
                  position: { vertical: "bottom", horizontal: "middle" }, // di bawah chart
                  padding: 10,
                },
              }}
              sx={{
                [`.${pieClasses.root}`]: {
                  transition: "all 0.3s ease-in-out",
                },
                [`.${pieArcClasses.root}:hover`]: {
                  filter: "brightness(1.3)",
                  transform: "scale(1.05)",
                  transition: "all 0.2s ease",
                },
              }}
            />
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default ViewPieChart;
