"use client";

import {
  Box,
  Button,
  CircularProgress,
  Modal,
  Typography,
  useMediaQuery,
  Fade,
  Divider,
  Grid,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import ImagePreviewModal from "../../components/imagepreviewmodal/page";
import formatRupiah from "../../components/formatrupiah/page";
import moment from "moment";
import PaymentApprovedOverlay from "./PaymentsApprovedOverlay";

const ApprovalModal = ({
  open,
  onClose,
  selectedData,
  loadingTrue,
  loadingFalse,
  onNotify,
  getDataPayments = () => {},
  user,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  const [openPreview, setOpenPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [switchImage, setSwitchImage] = useState("");

  // console.log("selectedData", selectedData);
  const theme = useTheme();

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
    transition: "box-shadow 0.3s",
    //hide scrollbar
    "&::-webkit-scrollbar": {
      display: "none",
    },
    position: "relative",
  };

  // console.log("user", user);

  const handleSubmit = async () => {
    loadingTrue();
    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `/api/payment-approval/${selectedData?.payment_approval?.id}`,
        {
          payment_id: selectedData?.payments?.payment_id,
          status: "approved",
          approver_id: user.id,
          role_id: user.role_id,
          tenant_application_id:
            selectedData?.tenant_application?.tenant_application_id,
          payment_type: selectedData?.tenant_application?.payment_type,
        }
      );
      console.log("response", response.data);

      if (response.data.success) {
        onNotify?.({
          open: true,
          message: response.data.message || "Berhasil Menyetujui Sewa Ruangan!",
          severity: "success",
        });
        getDataPayments();
        setTimeout(() => {
          onClose();
          loadingFalse();
          setIsSubmitting(false);
        }, 1000);
      } else {
        onNotify?.({
          open: true,
          message: response.data.message || "Gagal Menyetujui Sewa Ruangan.",
          severity: "error",
        });
        loadingFalse();
        setIsSubmitting(false);
      }
    } catch (error) {
      console.log("error", error);
      onNotify?.({
        open: true,
        message:
          error.response.data.message ||
          "Terjadi error saat menyetujui sewa ruangan.",
        severity: "error",
      });
      loadingFalse();
      setIsSubmitting(false);
    }
  };

  const handleSwitchImage = (image) => {
    // console.log("imageurl", image);

    if (image === "bukti_pembayaran") {
      setSwitchImage(selectedData?.payments?.proof_file_path);
      setOpenPreview(true);
    } else if (image === "KTP") {
      setSwitchImage(selectedData?.tenant_application?.ktp_file_path);
      setOpenPreview(true);
    }
  };

  // console.log("selectedData", selectedData);

  const handleCalculateTotal = () => {
    // Konversi nilai ke number
    const totalPayment = Number(
      selectedData?.tenant_application?.total_payment || 0
    );
    const downPayment = Number(
      selectedData?.tenant_application?.down_payment || 0
    );
    const remainingPayment = Number(
      selectedData?.payments?.remaining_balance || 0
    );
    const payment_amount = Number(selectedData?.payments?.payment_amount || 0);
    const contract_amount = Number(
      selectedData?.payments?.contract_amount || 0
    );
    const ppn_amount = Number(selectedData?.payments?.ppn_amount || 0);

    const totalPaymentInstallment = contract_amount + ppn_amount;
    const remainingPaymentAfterInstallment = remainingPayment;

    const totalSewaKontrakRuangan =
      selectedData?.room?.price_per_m2 * selectedData?.room?.room_area;

    // console.log('payment_amount', payment_amount);

    // Hitung Nilai Kontrak
    const nilaiKontrak = downPayment / 1.11;

    // Hitung PPN Down Payment
    const PPNDownPayment = nilaiKontrak * 0.11;

    // Hitung Total Uang Muka (DP)
    const totalDownPayment = nilaiKontrak + PPNDownPayment;

    // Hitung total PPN
    const totalPPN = totalSewaKontrakRuangan * 0.11;

    // Grand total (tambahan biaya administrasi 50.000)
    const grandTotal = totalSewaKontrakRuangan + totalPPN + 50000;

    return {
      remainingPaymentAfterInstallment,
      contract_amount,
      ppn_amount,
      totalPaymentInstallment,
      totalPayment,
      totalSewaKontrakRuangan,
      PPNDownPayment,
      totalDownPayment,
      nilaiKontrak,
      totalPPN,
      grandTotal,
      remainingPayment,
      payment_amount,
    };
  };

  const {
    remainingPaymentAfterInstallment,
    contract_amount,
    ppn_amount,
    totalPaymentInstallment,
    totalPayment,
    totalSewaKontrakRuangan,
    PPNDownPayment,
    totalDownPayment,
    nilaiKontrak,
    totalPPN,
    grandTotal,
    remainingPayment,
    payment_amount,
  } = handleCalculateTotal() || {
    remainingPaymentAfterInstallment: 0,
    contract_amount: 0,
    ppn_amount: 0,
    totalPaymentInstallment: 0,
    totalPayment: 0,
    totalSewaKontrakRuangan: 0,
    PPNDownPayment: 0,
    totalDownPayment: 0,
    nilaiKontrak: 0,
    totalPPN: 0,
    grandTotal: 0,
    remainingPayment: 0,
    payment_amount,
  };

  // Satu variabel kondisi biar lebih rapi
  const isRole8AndDone =
    user?.role_id === 8 &&
    (selectedData?.payment_approval?.status === "approved" ||
      selectedData?.payment_approval?.status === "rejected");

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
          {/* Detail Data Pemohon */}
          <Grid container spacing={1}>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: "bold",
                // color: theme.palette.primary.main,
              }}
            >
              Detail Data Pemohon
            </Typography>
          </Grid>

          <Divider
            sx={{
              mb: 1,
              borderColor: theme.palette.primary.main,
            }}
          />

          <Grid container spacing={2}>
            <Grid container size={isMobile ? 12 : 6} spacing={2}>
              <Grid
                size={isMobile ? 6 : 12}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: theme.palette.primary.main,
                  }}
                >
                  Nama Penyewa
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
                  {selectedData?.tenant_application?.tenant_name
                    ? selectedData.tenant_application?.tenant_name
                    : "-"}
                </Typography>
              </Grid>

              <Grid
                size={isMobile ? 6 : 12}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: theme.palette.primary.main,
                  }}
                >
                  NIK
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
                  {selectedData?.tenant_application?.tenant_nik
                    ? selectedData.tenant_application?.tenant_nik
                    : "-"}
                </Typography>
              </Grid>

              <Grid
                size={isMobile ? 6 : 12}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: theme.palette.primary.main,
                  }}
                >
                  Nomor Telepon
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
                  {selectedData?.tenant_application?.tenant_phone
                    ? selectedData.tenant_application?.tenant_phone
                    : "-"}
                </Typography>
              </Grid>
            </Grid>
            <Grid container size={isMobile ? 12 : 6} spacing={2}>
              <Grid size={12} sx={{ display: "flex", flexDirection: "column" }}>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: theme.palette.primary.main,
                  }}
                >
                  Foto KTP
                </Typography>

                {/* Container dengan tinggi tetap */}
                <Box
                  sx={{
                    width: "100%",
                    height: 150, // tinggi konsisten
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    borderRadius: 2,
                    // bgcolor: "#f8f8f8",
                  }}
                >
                  <img
                    src={
                      selectedData?.tenant_application?.ktp_file_path
                        ? selectedData.tenant_application?.ktp_file_path
                        : ""
                    }
                    alt="ktp"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain", // biar tetap proporsional
                    }}
                    onClick={() => handleSwitchImage("KTP")}
                  />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "11px",
                      color: theme.palette.primary.main,
                    }}
                  >
                    Tekan gambar untuk memperbesar
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Detail Lokasi */}
          <Grid container spacing={1} mt={3}>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: "bold",
                // color: theme.palette.primary.main,
              }}
            >
              Detail Lokasi & Ruangan
            </Typography>
          </Grid>

          <Divider
            sx={{
              mb: 1,
              borderColor: theme.palette.primary.main,
            }}
          />

          <Grid container spacing={1}>
            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Lokasi
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
                {selectedData?.location?.location_name
                  ? selectedData.location?.location_name
                  : "-"}
              </Typography>
            </Grid>
            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Ruangan
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
                {selectedData?.room?.room_number
                  ? selectedData.room?.room_number
                  : "-"}
              </Typography>
            </Grid>
            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Lantai
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
                {selectedData?.room?.floor ? selectedData.room?.floor : "-"}
              </Typography>
            </Grid>
            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Panjang (m)
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
                {selectedData?.room?.room_length
                  ? selectedData.room?.room_length
                  : "-"}
              </Typography>
            </Grid>
            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Lebar (m)
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
                {selectedData?.room?.room_width
                  ? selectedData.room?.room_width
                  : "-"}
              </Typography>
            </Grid>
            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Luas (m)
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
                {selectedData?.room?.room_area
                  ? selectedData.room?.room_area
                  : "-"}
              </Typography>
            </Grid>
            <Grid
              size={isMobile ? 6 : 12}
              sx={{ display: "flex", flexDirection: "column" }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Masa Berlaku
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
                {selectedData?.tenant_application?.start_date &&
                selectedData?.tenant_application?.end_date
                  ? moment(selectedData?.tenant_application?.start_date).format(
                      "D MMM YYYY"
                    ) +
                    " s/d " +
                    moment(selectedData?.tenant_application?.end_date).format(
                      "D MMM YYYY"
                    )
                  : "-"}
              </Typography>
            </Grid>
          </Grid>

          {/* Detail Pembayaran */}
          <Grid container spacing={1} mt={2}>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: "bold",
                // color: theme.palette.primary.main,
              }}
            >
              Detail Pembayaran
            </Typography>
          </Grid>

          <Divider
            sx={{
              mb: 1,
              borderColor: theme.palette.primary.main,
            }}
          />

          <Grid container spacing={0.2}>
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
                Tipe Pembayaran
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
                {selectedData?.tenant_application?.payment_type === "cicilan"
                  ? "Cicilan"
                  : "Lunas"}
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
                {/* {selectedData?.total_payment
                          ? formatRupiah(selectedData.total_payment)
                          : "-"} */}{" "}
                {formatRupiah(50000)}
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
                Biaya PPN
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
          </Grid>

          <Divider
            sx={{
              mb: 0.5,
              mt: 0.5,
              borderColor: theme.palette.primary.main,
            }}
          />

          {/* Total Pembayaran */}
          <Grid container spacing={1}>
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
                {grandTotal ? formatRupiah(grandTotal) : "-"}
              </Typography>
            </Grid>
          </Grid>
          <Divider
            sx={{
              mb: 0.5,
              mt: 0.5,
              borderColor: theme.palette.primary.main,
            }}
          />

          {selectedData?.tenant_application?.payment_type === "cicilan" && (
            <>
              <Grid size={12} mt={3}>
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
                  {selectedData?.tenant_application?.down_payment
                    ? formatRupiah(
                        selectedData?.tenant_application?.down_payment
                      )
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
                  {nilaiKontrak ? formatRupiah(nilaiKontrak) : "-"}
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
                  {PPNDownPayment ? formatRupiah(PPNDownPayment) : "-"}
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
                  {totalDownPayment ? formatRupiah(totalDownPayment) : "-"}
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

              {/* Detail Pembayaran */}
              <Grid container spacing={1} mt={3}>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: "bold",
                    // color: theme.palette.primary.main,
                  }}
                >
                  Detail Cicilan
                </Typography>
              </Grid>

              <Divider
                sx={{
                  mb: 0.5,
                  borderColor: theme.palette.primary.main,
                }}
              />

              <Grid container size={12} spacing={0.2}>
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
                    Cicilan {selectedData?.payments?.payment_number}
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
                    {payment_amount ? formatRupiah(payment_amount) : "-"}
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
                    {contract_amount ? formatRupiah(contract_amount) : "-"}
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
                    Biaya PPN
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
                    {ppn_amount ? formatRupiah(ppn_amount) : "-"}
                  </Typography>
                </Grid>
              </Grid>

              <Divider
                sx={{
                  mb: 0.5,
                  mt: 0.5,
                  borderColor: theme.palette.primary.main,
                }}
              />

              {/* Total Pembayaran Cicilan */}
              <Grid container spacing={1}>
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
                    {totalPaymentInstallment
                      ? formatRupiah(totalPaymentInstallment)
                      : "-"}
                  </Typography>
                </Grid>
              </Grid>

              <Divider
                sx={{
                  mb: 0.5,
                  mt: 0.5,
                  borderColor: theme.palette.primary.main,
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
                  {remainingPaymentAfterInstallment
                    ? formatRupiah(remainingPaymentAfterInstallment)
                    : "-"}
                </Typography>
              </Grid>
            </>
          )}

          <Grid container spacing={1} mt={2}>
            <Grid size={12} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                  mb: 0.5,
                }}
              >
                Foto Bukti Transfer
              </Typography>

              {/* Container dengan tinggi tetap */}
              <Box
                sx={{
                  width: "100%",
                  height: 150, // tinggi konsisten
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  overflow: "hidden",
                  borderRadius: 2,
                  // bgcolor: "#f8f8f8",
                }}
              >
                <img
                  src={
                    selectedData?.payments?.proof_file_path
                      ? selectedData.payments?.proof_file_path
                      : ""
                  }
                  alt="ktp"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain", // biar tetap proporsional
                  }}
                  onClick={() => handleSwitchImage("bukti_pembayaran")}
                />
              </Box>

              {/* <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  flexDirection: "row",
                  mt: 0.5,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "11px",
                    color: theme.palette.primary.main,
                  }}
                >
                  Tekan gambar untuk memperbesar
                </Typography>
              </Box> */}
            </Grid>
          </Grid>

          <Grid
            container
            spacing={1}
            sx={{
              mt: 5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Grid size={isRole8AndDone ? 12 : 6}>
              <Button
                type="submit"
                variant="contained"
                color="error"
                size="small"
                sx={{
                  fontWeight: "bold",
                  fontSize: 16,
                  textTransform: "none",
                  width: isRole8AndDone ? "100%" : 150,
                }}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
            </Grid>
            {user?.role_id === 8 && !isRole8AndDone && (
              <Grid size={6} sx={{ textAlign: "right" }}>
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  sx={{
                    fontWeight: "bold",
                    fontSize: 16,
                    textTransform: "none",
                    width: 150,
                    color: "white",
                  }}
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting && (
                      <CircularProgress size={22} color="inherit" />
                    )
                  }
                  onClick={handleSubmit}
                >
                  {isSubmitting ? "Mengirim..." : "Approve"}
                </Button>
              </Grid>
            )}
          </Grid>

          <PaymentApprovedOverlay selectedData={selectedData} />

          {/* Modal Preview Gambar */}
          <ImagePreviewModal
            open={openPreview}
            onClose={() => setOpenPreview(false)}
            imageUrl={switchImage}
            alt="preview-image"
          />
        </Box>
      </Fade>
    </Modal>
  );
};

export default ApprovalModal;
