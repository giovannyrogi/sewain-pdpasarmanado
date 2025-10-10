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
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: 10,
        },
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
              width={210}
              height={210}
              animation="wave"
            />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
              }}
            >
              <Skeleton
                variant="text"
                width="100%"
                height={30}
                animation="wave"
              />
              <Skeleton
                variant="text"
                width="100%"
                height={30}
                animation="wave"
              />
              <Skeleton
                variant="text"
                width="100%"
                height={30}
                animation="wave"
              />
            </Box>
          </Box>
        ) : (
          <Grid container size={12}>
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
                width={210}
                height={210}
                slotProps={{
                  tooltip: {
                    trigger: "item",
                  },
                  legend: {
                    // direction: "row", // horizontal
                    // position: { vertical: "bottom", horizontal: "middle" }, // di bawah chart
                    // padding: 10,
                    hidden: true,
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

            <Grid container size={12} sx={{ margin: "0px 10px 5px 10px" }}>
              <Grid
                size={12}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 1,
                  }}
                >
                  <Icon
                    icon="mynaui:diamond-solid"
                    fontSize={15}
                    color="#4caf50"
                  />
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      fontFamily: "poppins",
                    }}
                  >
                    Disetujui
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    fontFamily: "poppins",
                  }}
                >
                  ({contractApprovalStatus.approved || 0})
                </Typography>
              </Grid>

              <Divider
                sx={{
                  width: "100%",
                  borderColor: theme.palette.text.secondary,
                }}
              />

              <Grid
                size={12}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 1,
                  }}
                >
                  <Icon
                    icon="mynaui:diamond-solid"
                    fontSize={15}
                    color="#ffb300"
                  />
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      fontFamily: "poppins",
                    }}
                  >
                    Dalam Proses
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    fontFamily: "poppins",
                  }}
                >
                  ({contractApprovalStatus.process || 0})
                </Typography>
              </Grid>

              <Divider
                sx={{
                  width: "100%",
                  borderColor: theme.palette.text.secondary,
                }}
              />

              <Grid
                size={12}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 1,
                  }}
                >
                  <Icon
                    icon="mynaui:diamond-solid"
                    fontSize={15}
                    color="#f44336"
                  />
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      fontFamily: "poppins",
                    }}
                  >
                    Ditolak
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    fontFamily: "poppins",
                  }}
                >
                  ({contractApprovalStatus.rejected || 0})
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default ViewPieChart;
