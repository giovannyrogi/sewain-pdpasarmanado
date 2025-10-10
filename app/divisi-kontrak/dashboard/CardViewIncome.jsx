import formatRupiah from "@/app/components/formatrupiah/page";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import {
  Box,
  Checkbox,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Tag } from "antd";
import React, { useState } from "react";

const CardViewIncome = ({
  currentMonthIncomeWithTax,
  currentMonthIncomeWithoutTax,
  loading,
}) => {
  const theme = useTheme();
  const { themeMode } = useThemeMode();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:1200px)");
  const [checked, setChecked] = useState(false);

  // console.log("currentMonthIncomeWithTax", currentMonthIncomeWithTax);
  // console.log("currentMonthIncomeWithoutTax", currentMonthIncomeWithoutTax);

  const handleChange = (event) => {
    // console.log("checked", event.target.checked);

    setChecked(event.target.checked);
  };

  return (
    <Paper
      elevation={6}
      sx={{
        backgroundColor: "background.default",
        p: 2,
        height: "200px",
        borderRadius: "15px",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-10px)",
          boxShadow: 10,
        },
      }}
    >
      <Grid container spacing={1}>
        <Grid container spacing={1} size={12}>
          {loading ? (
            <Skeleton variant="rounded" width="100%" height={20} />
          ) : (
            <Grid size={7}>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  fontFamily: "poppins",
                }}
              >
                Pendapatan Bulan Ini
              </Typography>
            </Grid>
          )}

          <Grid
            size={5}
            display={"flex"}
            flexDirection={"row"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            gap={1}
          >
            {!loading && (
              <>
                <Typography
                  sx={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    fontFamily: "poppins",
                  }}
                >
                  PPN 11%
                </Typography>
                <Checkbox
                  checked={checked}
                  size="small"
                  onChange={handleChange}
                  sx={{
                    m: 0,
                    p: 0,
                  }}
                />
              </>
            )}
          </Grid>
        </Grid>

        {loading ? undefined : (
          <Divider
            sx={{
              // borderWidth: "1px",
              borderColor: theme.palette.primary.main,
              // mt: 1,
              width: "100%",
              mt: "-5px",
              mb: 3,
            }}
          />
        )}

        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              height: "100%",
              width: "100%",
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                justifyContent: "center",
                alignItems: "flex-start",
                height: "100%",
                width: "78%",
              }}
            >
              <Skeleton variant="rounded" width="100%" height={40} />
              <Skeleton
                variant="rounded"
                animation="wave"
                width="100%"
                height={30}
              />
              <Skeleton variant="rounded" width="100%" height={20} />
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                gap: 1,
                width: "22%",
                height: "100%",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <Skeleton variant="circular" width={300} height={80} />
            </Box>
          </Box>
        ) : (
          <>
            <Grid
              container
              size={9}
              spacing={1}
              // backgroundColor="blue"
            >
              <Grid size={12} mt={-1}>
                {currentMonthIncomeWithTax && currentMonthIncomeWithoutTax && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: "5px",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        fontFamily: "poppins",
                      }}
                    >
                      Rp.
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "30px",
                        fontWeight: "bold",
                        fontFamily: "poppins",
                      }}
                    >
                      {checked
                        ? formatRupiah(
                            Number(
                              currentMonthIncomeWithTax?.current_month
                                ?.total_income
                            ) || 0,
                            "hideRp"
                          )
                        : formatRupiah(
                            Number(
                              currentMonthIncomeWithoutTax?.current_month
                                ?.total_income
                            ) || 0,
                            "hideRp"
                          )}
                    </Typography>
                  </Box>
                )}
              </Grid>
              {currentMonthIncomeWithTax?.last_month?.total_income === 0 &&
              currentMonthIncomeWithoutTax?.last_month?.total_income === 0 ? (
                <Grid container mt={3}>
                  <Grid size={12}>
                    <Typography
                      sx={{
                        fontSize: "11px",
                        fontWeight: "bold",
                        fontFamily: "poppins",
                        // baris baru ketika mencapai max width
                        wordWrap: "break-word",
                        whiteSpace: "pre-wrap",
                        overflow: "hidden",
                        // textAlign: "justify",
                      }}
                    >
                      Belum ada data pendapatan bulan lalu untuk jadi
                      perbandingan.
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <>
                  {checked ? (
                    currentMonthIncomeWithTax?.trend === "up" ? (
                      <Grid container size={12}>
                        <Grid
                          size={12}
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Tag
                            color="green"
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <Icon
                              icon="iconamoon:trend-up-fill"
                              fontSize={20}
                              style={{
                                color: "green",
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: "11px",
                                fontWeight: "bold",
                                fontFamily: "poppins",
                                // baris baru ketika mencapai max width
                                wordWrap: "break-word",
                                whiteSpace: "pre-wrap",
                                overflow: "hidden",
                                textAlign: "justify",
                              }}
                            >
                              {currentMonthIncomeWithTax?.percentage_change}% (+{" "}
                              {formatRupiah(
                                currentMonthIncomeWithTax?.difference || 0
                              )}
                              )
                            </Typography>
                          </Tag>
                        </Grid>
                        <Grid size={12} mt={1.5}>
                          <Typography
                            sx={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              fontFamily: "poppins",
                              // baris baru ketika mencapai max width
                              wordWrap: "break-word",
                              whiteSpace: "pre-wrap",
                              overflow: "hidden",
                              // textAlign: "justify",
                            }}
                          >
                            Pendapatan meningkat dibandingkan dengan bulan lalu{" "}
                            <span
                              style={{
                                color: theme.palette.primary.main,
                              }}
                            >
                              {formatRupiah(
                                currentMonthIncomeWithTax?.last_month
                                  ?.total_income || 0
                              )}
                            </span>
                          </Typography>
                        </Grid>
                      </Grid>
                    ) : currentMonthIncomeWithTax?.trend === "down" ? (
                      <Grid container size={12}>
                        <Grid
                          size={12}
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Tag
                            color="red"
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <Icon
                              icon="iconamoon:trend-down-fill"
                              fontSize={20}
                              style={{
                                color: "red",
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: "11px",
                                fontWeight: "bold",
                                fontFamily: "poppins",
                                // baris baru ketika mencapai max width
                                wordWrap: "break-word",
                                whiteSpace: "pre-wrap",
                                overflow: "hidden",
                                textAlign: "justify",
                              }}
                            >
                              {currentMonthIncomeWithTax?.percentage_change}% (-{" "}
                              {formatRupiah(
                                currentMonthIncomeWithTax?.difference || 0
                              )}
                              )
                            </Typography>
                          </Tag>
                        </Grid>
                        <Grid size={12} mt={1.5}>
                          <Typography
                            sx={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              fontFamily: "poppins",
                              // baris baru ketika mencapai max width
                              wordWrap: "break-word",
                              whiteSpace: "pre-wrap",
                              overflow: "hidden",
                              // textAlign: "justify",
                            }}
                          >
                            Pendapatan menurun dibandingkan dengan bulan lalu{" "}
                            <span
                              style={{
                                color: theme.palette.primary.main,
                              }}
                            >
                              {formatRupiah(
                                currentMonthIncomeWithTax?.last_month
                                  ?.total_income || 0
                              )}
                            </span>
                          </Typography>
                        </Grid>
                      </Grid>
                    ) : undefined
                  ) : currentMonthIncomeWithoutTax?.trend === "up" ? (
                    <Grid container size={12}>
                      <Grid
                        size={12}
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Tag
                          color="green"
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Icon
                            icon="iconamoon:trend-up-fill"
                            fontSize={20}
                            style={{
                              color: "green",
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              fontFamily: "poppins",
                              // baris baru ketika mencapai max width
                              wordWrap: "break-word",
                              whiteSpace: "pre-wrap",
                              overflow: "hidden",
                              textAlign: "justify",
                            }}
                          >
                            {currentMonthIncomeWithoutTax?.percentage_change}%
                            (+{" "}
                            {formatRupiah(
                              currentMonthIncomeWithoutTax?.difference || 0
                            )}
                            )
                          </Typography>
                        </Tag>
                      </Grid>
                      <Grid size={12} mt={1.5}>
                        <Typography
                          sx={{
                            fontSize: "11px",
                            fontWeight: "bold",
                            fontFamily: "poppins",
                            // baris baru ketika mencapai max width
                            wordWrap: "break-word",
                            whiteSpace: "pre-wrap",
                            overflow: "hidden",
                            // textAlign: "justify",
                          }}
                        >
                          Pendapatan meningkat dibandingkan dengan bulan lalu{" "}
                          <span
                            style={{
                              color: theme.palette.primary.main,
                            }}
                          >
                            {formatRupiah(
                              currentMonthIncomeWithoutTax?.last_month
                                ?.total_income || 0
                            )}
                          </span>
                        </Typography>
                      </Grid>
                    </Grid>
                  ) : currentMonthIncomeWithoutTax?.trend === "down" ? (
                    <Grid container size={12}>
                      <Grid
                        size={12}
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Tag
                          color="red"
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Icon
                            icon="iconamoon:trend-down-fill"
                            fontSize={20}
                            style={{
                              color: "red",
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              fontFamily: "poppins",
                              // baris baru ketika mencapai max width
                              wordWrap: "break-word",
                              whiteSpace: "pre-wrap",
                              overflow: "hidden",
                              textAlign: "justify",
                            }}
                          >
                            {currentMonthIncomeWithoutTax?.percentage_change}%
                            (-{" "}
                            {formatRupiah(
                              currentMonthIncomeWithoutTax?.difference || 0
                            )}
                            )
                          </Typography>
                        </Tag>
                      </Grid>
                      <Grid size={12} mt={1.5}>
                        <Typography
                          sx={{
                            fontSize: "11px",
                            fontWeight: "bold",
                            fontFamily: "poppins",
                            // baris baru ketika mencapai max width
                            wordWrap: "break-word",
                            whiteSpace: "pre-wrap",
                            overflow: "hidden",
                            // textAlign: "justify",
                          }}
                        >
                          Pendapatan menurun dibandingkan dengan bulan lalu{" "}
                          <span
                            style={{
                              color: theme.palette.primary.main,
                            }}
                          >
                            {formatRupiah(
                              currentMonthIncomeWithoutTax?.last_month
                                ?.total_income || 0
                            )}
                          </span>
                        </Typography>
                      </Grid>
                    </Grid>
                  ) : undefined}
                </>
              )}
            </Grid>
            {/* Icon Money Bag */}
            <Grid container size={3} align="end">
              <Grid size={12}>
                <Icon icon="emojione:money-bag" fontSize={70} />
              </Grid>
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
};

export default CardViewIncome;
