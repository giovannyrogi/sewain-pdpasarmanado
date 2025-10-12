import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
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
import { BarChart } from "@mui/x-charts";
import { Icon } from "@iconify/react";

const CardViewStatusRooms = ({ data, loading }) => {
  const theme = useTheme();
  const { themeMode } = useThemeMode();
  const isMobile = useMediaQuery("(max-width:600px)");

  console.log("data", data);

  // Warna & label sesuai status
  const statusMap = {
    available: { label: "Tersedia", color: "#4CAF50" }, // hijau
    occupied: { label: "Sudah Terisi", color: "#FFEB3B" }, // merah
    maintenance: { label: "Dalam Perbaikan", color: "#FF9800" }, // oranye
    unavailable: { label: "Tidak Layak", color: "#F44336" }, // kuning
  };

  const statuses = ["available", "occupied", "unavailable", "maintenance"];

  // Dataset: 1 bar mewakili 1 status (ambil dari object data, bukan array)
  const dataset =
    statuses.map((status) => ({
      status: statusMap[status].label,
      value: data?.[status] ?? 0, // gunakan nilai dari object
    })) || [];

  // Array warna sesuai urutan dataset
  const colors = statuses.map((s) => statusMap[s].color);

  return (
    <Paper
      elevation={6}
      sx={{
        backgroundColor: "background.default",
        p: 2,
        // height: "180px",
        borderRadius: "15px",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: 0,
        },
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
              Status Ruangan
            </Typography>
          </Grid>
        )}

        {!loading && (
          <Divider
            sx={{
              borderColor: theme.palette.primary.main,
              width: "100%",
              mt: "-5px",
              mb: 1.5,
            }}
          />
        )}

        {/* Content */}
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
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyItems: "center",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Skeleton
                variant="rectangular"
                width={60}
                height={80}
                animation="wave"
              />
              <Skeleton
                variant="rectangular"
                width={60}
                height={80}
                animation="wave"
              />
              <Skeleton
                variant="rectangular"
                width={60}
                height={80}
                animation="wave"
              />
              <Skeleton
                variant="rectangular"
                width={60}
                height={80}
                animation="wave"
              />
            </Box>
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
              <Skeleton
                variant="text"
                width="100%"
                height={30}
                animation="wave"
              />
            </Box>
          </Box>
        ) : (
          <Grid container size={12} spacing={1}>
            <BarChart
              dataset={dataset}
              xAxis={[
                {
                  scaleType: "band",
                  dataKey: "status",
                  colorMap: {
                    type: "ordinal",
                    values: dataset.map((d) => d.status),
                    colors: colors,
                  },
                },
              ]}
              series={[
                {
                  dataKey: "value",
                  label: "Total",
                },
              ]}
              grid={{ horizontal: false, vertical: false }}
              slotProps={{
                legend: { hidden: true },
              }}
              sx={{
                "& .MuiChartsAxis-root": { display: "none" },
                "& .MuiChartsLegend-root": { display: "none" },
                "& .MuiBarElement-root": { stroke: "none" },
              }}
              height={120}
            />

            {data?.available === 0 &&
            data?.occupied === 0 &&
            data?.unavailable === 0 &&
            data?.maintenance === 0 ? (
              <Box
                sx={{
                  width: "100%",
                  textAlign: "center",
                  mt: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontFamily: "poppins",
                    color: theme.palette.text.main,
                  }}
                >
                  Tidak ada data ruangan yang tersedia
                </Typography>
              </Box>
            ) : (
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
                      icon="fluent-mdl2:work-item-bar-solid"
                      fontSize={20}
                      color="#4caf50"
                    />
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        fontFamily: "poppins",
                      }}
                    >
                      Tersedia
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      fontFamily: "poppins",
                    }}
                  >
                    ({data?.available || 0})
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
                      icon="fluent-mdl2:work-item-bar-solid"
                      fontSize={20}
                      color="#FFEB3B"
                    />
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        fontFamily: "poppins",
                      }}
                    >
                      Sudah Terisi
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      fontFamily: "poppins",
                    }}
                  >
                    ({data?.occupied || 0})
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
                      icon="fluent-mdl2:work-item-bar-solid"
                      fontSize={20}
                      color="#FF9800"
                    />
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        fontFamily: "poppins",
                      }}
                    >
                      Dalam Perbaikan
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      fontFamily: "poppins",
                    }}
                  >
                    ({data?.maintenance || 0})
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
                      icon="fluent-mdl2:work-item-bar-solid"
                      fontSize={20}
                      color="#f44336"
                    />
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        fontFamily: "poppins",
                      }}
                    >
                      Tidak Layak
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      fontFamily: "poppins",
                    }}
                  >
                    ({data?.unavailable || 0})
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default CardViewStatusRooms;
