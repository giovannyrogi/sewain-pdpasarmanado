"use client";

import {
  Box,
  Modal,
  Typography,
  useMediaQuery,
  Fade,
  Divider,
  Grid,
  useTheme,
  Button,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import moment from "moment";
import formatRupiah from "../formatrupiah/page";

const ViewCalcPPNModal = ({
  open,
  onClose,
  loading,
  loadingTrue,
  loadingFalse,
  setLoadingMessage,
  totalPayment,
  downPayment,
  estimatedInstallment1,
  estimatedInstallment2,
  estimatedInstallment3,
  remainingPayment,
  paymentType,
  totalSewaKontrakRuangan,
  totalPPN,
  estimatedInstallmentDate1,
  estimatedInstallmentDate2,
  estimatedInstallmentDate3,
  biayaAdministrasi,
  totalPPNDownPayment,
  totalSewaKontrakDownPayment,
  totalPaymentDownPayment,
  totalInstallment,
  chooseTenor,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const theme = useTheme();
  const [approvalList, setApprovalList] = useState([]);
  const [openPreview, setOpenPreview] = useState(false);

  const installments = [
    {
      label: estimatedInstallmentDate1
        ? `Cicilan 1 (Bulan ${moment(estimatedInstallmentDate1).format(
            "MMM YYYY"
          )})`
        : "Pilih tanggal pembayaran",
      amount: formatRupiah(estimatedInstallment1),
    },
    {
      label: estimatedInstallmentDate2
        ? `Cicilan 2 (Bulan ${moment(estimatedInstallmentDate2).format(
            "MMM YYYY"
          )})`
        : "Pilih tanggal pembayaran",
      amount: formatRupiah(estimatedInstallment2),
    },
    {
      label: estimatedInstallmentDate3
        ? `Cicilan 3 (Bulan ${moment(estimatedInstallmentDate3).format(
            "MMM YYYY"
          )})`
        : "Pilih tanggal pembayaran",
      amount: formatRupiah(estimatedInstallment3),
    },
  ];

  const style = {
    width: isMobile ? "90vw" : 500,
    maxWidth: "98vw",
    bgcolor: "background.paper",
    color: "text.primary",
    borderRadius: "10px",
    boxShadow: 24,
    p: "18px 20px 18px 20px",
    maxHeight: "90vh",
    overflowY: "auto",
    //hide scrollbar
    "&::-webkit-scrollbar": {
      display: "none",
    },
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 0, // hilangkan padding default
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(30,30,30,0.25)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        },
      }}
    >
      <Fade in={open}>
        <Box sx={style}>
          <Grid container size={12}>
            <Grid size={12}>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: "bold",
                  mb: isMobile ? 0.5 : undefined,
                }}
              >
                Rincian Pembayaran
              </Typography>
            </Grid>

            <Divider
              sx={{
                mb: 0.5,
                borderColor: theme.palette.primary.main,
                width: "100%",
              }}
            />

            <Grid
              size={12}
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                Tipe Pembayaran
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bolder",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                  //   color: paymentType === "cicilan" ? "blue" : "green",
                }}
              >
                {paymentType === "cicilan" ? "Cicilan" : "Lunas"}
              </Typography>
            </Grid>

            <Grid
              size={12}
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                Total Sewa Kontrak Ruangan
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {totalSewaKontrakRuangan
                  ? formatRupiah(totalSewaKontrakRuangan)
                  : "-"}
              </Typography>
            </Grid>

            <Grid
              size={12}
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                Iuran Jasa Administrasi
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {biayaAdministrasi ? formatRupiah(biayaAdministrasi) : "-"}
              </Typography>
            </Grid>

            <Grid
              size={12}
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                PPN 11%
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {totalPPN ? formatRupiah(totalPPN) : "-"}
              </Typography>
            </Grid>

            <Divider
              sx={{
                borderColor: theme.palette.primary.main,
                width: "100%",
                mb: 0.5,
                mt: 0.5,
              }}
            />

            <Grid
              size={12}
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                Total Pembayaran
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {totalPayment ? formatRupiah(totalPayment) : "-"}
              </Typography>
            </Grid>

            <Divider
              sx={{
                borderColor: theme.palette.primary.main,
                width: "100%",
                mb: 2,
                mt: 0.5,
              }}
            />

            {paymentType === "cicilan" && (
              <>
                <Grid size={12}>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: "bold",
                      mb: isMobile ? 0.5 : undefined,
                    }}
                  >
                    Pembayaran Pertama
                  </Typography>
                </Grid>

                <Divider
                  sx={{
                    mb: 0.5,
                    borderColor: theme.palette.primary.main,
                    width: "100%",
                  }}
                />

                <Grid
                  size={12}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    Uang Muka (DP)
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                      wordBreak: "break-word", // <-- biar kata panjang pecah
                      whiteSpace: "normal", // <-- biar bisa turun baris
                      overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                    }}
                  >
                    {downPayment ? formatRupiah(downPayment) : "-"}
                  </Typography>
                </Grid>

                <Grid
                  size={12}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    Nilai Kontrak
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                      wordBreak: "break-word", // <-- biar kata panjang pecah
                      whiteSpace: "normal", // <-- biar bisa turun baris
                      overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                    }}
                  >
                    {totalSewaKontrakDownPayment
                      ? formatRupiah(totalSewaKontrakDownPayment)
                      : "-"}
                  </Typography>
                </Grid>

                <Grid
                  size={12}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    PPN 11%
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                      wordBreak: "break-word", // <-- biar kata panjang pecah
                      whiteSpace: "normal", // <-- biar bisa turun baris
                      overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                    }}
                  >
                    {totalPPNDownPayment
                      ? formatRupiah(totalPPNDownPayment)
                      : "-"}
                  </Typography>
                </Grid>

                <Divider
                  sx={{
                    borderColor: theme.palette.primary.main,
                    width: "100%",
                    mb: 0.5,
                    mt: 0.5,
                  }}
                />

                <Grid
                  size={12}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    Total Pembayaran
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                      wordBreak: "break-word", // <-- biar kata panjang pecah
                      whiteSpace: "normal", // <-- biar bisa turun baris
                      overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                    }}
                  >
                    {totalPaymentDownPayment
                      ? formatRupiah(totalPaymentDownPayment)
                      : "-"}
                  </Typography>
                </Grid>

                <Divider
                  sx={{
                    borderColor: theme.palette.primary.main,
                    width: "100%",
                    mb: 0.5,
                    mt: 0.5,
                  }}
                />

                <Grid
                  size={12}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    Sisa Pembayaran
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                      wordBreak: "break-word", // <-- biar kata panjang pecah
                      whiteSpace: "normal", // <-- biar bisa turun baris
                      overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                    }}
                  >
                    {remainingPayment ? formatRupiah(remainingPayment) : "-"}
                  </Typography>
                </Grid>

                <Grid size={12}>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: "bold",
                      mb: isMobile ? 0.5 : undefined,
                    }}
                  >
                    Rencana Cicilan
                  </Typography>
                </Grid>

                <Divider
                  sx={{
                    mb: 0.5,
                    borderColor: theme.palette.primary.main,
                    width: "100%",
                  }}
                />

                {installments.slice(0, chooseTenor).map((item, index) => (
                  <Grid
                    size={12}
                    key={index}
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        fontSize: "13px",
                      }}
                    >
                      {item?.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        fontSize: "13px",
                        wordBreak: "break-word",
                        whiteSpace: "normal",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {item?.amount}
                    </Typography>
                  </Grid>
                ))}

                <Divider
                  sx={{
                    borderColor: theme.palette.primary.main,
                    width: "100%",
                    mb: 0.5,
                    mt: 0.5,
                  }}
                />

                <Grid
                  size={12}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    Total Cicilan
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                      wordBreak: "break-word", // <-- biar kata panjang pecah
                      whiteSpace: "normal", // <-- biar bisa turun baris
                      overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                    }}
                  >
                    {totalInstallment ? formatRupiah(totalInstallment) : "-"}
                  </Typography>
                </Grid>

                <Divider
                  sx={{
                    borderColor: theme.palette.primary.main,
                    width: "100%",
                    mb: 0.5,
                    mt: 0.5,
                  }}
                />
              </>
            )}

            <Grid size={12} mt={2}>
              <Button
                fullWidth
                size="small"
                variant="contained"
                color="error"
                onClick={onClose}
              >
                Kembali
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Modal>
  );
};

export default ViewCalcPPNModal;
