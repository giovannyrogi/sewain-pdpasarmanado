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
import InstallmentDetail from "@/app/components/installment-detail/InstallmentDetail";
import PaymentProof from "../../components/installment-detail/PaymentProof";
import Image from "next/image";

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

  const handleSwitchImage = (image, imageUrl) => {
    // console.log("imageurl", image);

    if (image === "bukti_pembayaran") {
      setSwitchImage(imageUrl);
      setOpenPreview(true);
    } else if (image === "KTP") {
      setSwitchImage(imageUrl);
      setOpenPreview(true);
    }
  };

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

    // Previous Payment DP
    let previousAmountDP = 0;
    let previousContractAmountDP = 0;
    let previousPPNDP = 0;
    let previousProofFilePathDP = "";
    let previousPaymentDateDP = "";
    let previousPaymentNumberDP = 0;
    let previousRemainingBalanceDP = 0;

    // Previous Payment 1
    let previousAmount1 = 0;
    let previousContractAmount1 = 0;
    let previousPPN1 = 0;
    let previousProofFilePath1 = "";
    let previousPaymentDate1 = "";
    let previousPaymentNumber1 = 0;
    let previousRemainingBalance1 = 0;

    // Previous Payment 2
    let previousAmount2 = 0;
    let previousContractAmount2 = 0;
    let previousPPN2 = 0;
    let previousProofFilePath2 = "";
    let previousPaymentDate2 = "";
    let previousPaymentNumber2 = 0;
    let previousRemainingBalance2 = 0;

    // Previous Payment 3
    let previousAmount3 = 0;
    let previousContractAmount3 = 0;
    let previousPPN3 = 0;
    let previousProofFilePath3 = "";
    let previousPaymentDate3 = "";
    let previousPaymentNumber3 = 0;
    let previousRemainingBalance3 = 0;

    if (selectedData?.payments?.previous_payments?.length > 0) {
      previousAmountDP = Number(
        selectedData?.payments?.previous_payments[0]?.amount || 0
      );
      previousContractAmountDP = Number(
        selectedData?.payments?.previous_payments[0]?.contract_amount || 0
      );
      previousPPNDP = Number(
        selectedData?.payments?.previous_payments[0]?.ppn_amount || 0
      );
      previousProofFilePathDP =
        selectedData?.payments?.previous_payments[0]?.proof_file_path;
      previousPaymentDateDP =
        selectedData?.payments?.previous_payments[0]?.payment_date;
      previousPaymentNumberDP =
        selectedData?.payments?.previous_payments[0]?.payment_number;
      previousRemainingBalanceDP = Number(
        selectedData?.payments?.previous_payments[0]?.remaining_balance || 0
      );

      previousAmount1 = Number(
        selectedData?.payments?.previous_payments[1]?.amount || 0
      );
      previousContractAmount1 = Number(
        selectedData?.payments?.previous_payments[1]?.contract_amount || 0
      );
      previousPPN1 = Number(
        selectedData?.payments?.previous_payments[1]?.ppn_amount || 0
      );
      previousProofFilePath1 =
        selectedData?.payments?.previous_payments[1]?.proof_file_path;
      previousPaymentDate1 =
        selectedData?.payments?.previous_payments[1]?.payment_date;
      previousPaymentNumber1 =
        selectedData?.payments?.previous_payments[1]?.payment_number;
      previousRemainingBalance1 = Number(
        selectedData?.payments?.previous_payments[1]?.remaining_balance || 0
      );

      previousAmount2 = Number(
        selectedData?.payments?.previous_payments[2]?.amount || 0
      );
      previousContractAmount2 = Number(
        selectedData?.payments?.previous_payments[2]?.contract_amount || 0
      );
      previousPPN2 = Number(
        selectedData?.payments?.previous_payments[2]?.ppn_amount || 0
      );
      previousProofFilePath2 =
        selectedData?.payments?.previous_payments[2]?.proof_file_path;
      previousPaymentDate2 =
        selectedData?.payments?.previous_payments[2]?.payment_date;
      previousPaymentNumber2 =
        selectedData?.payments?.previous_payments[2]?.payment_number;
      previousRemainingBalance2 = Number(
        selectedData?.payments?.previous_payments[2]?.remaining_balance || 0
      );

      previousAmount3 = Number(
        selectedData?.payments?.previous_payments[3]?.amount || 0
      );
      previousContractAmount3 = Number(
        selectedData?.payments?.previous_payments[3]?.contract_amount || 0
      );
      previousPPN3 = Number(
        selectedData?.payments?.previous_payments[3]?.ppn_amount || 0
      );
      previousProofFilePath3 =
        selectedData?.payments?.previous_payments[3]?.proof_file_path;
      previousPaymentDate3 =
        selectedData?.payments?.previous_payments[3]?.payment_date;
      previousPaymentNumber3 =
        selectedData?.payments?.previous_payments[3]?.payment_number;
      previousRemainingBalance3 = Number(
        selectedData?.payments?.previous_payments[3]?.remaining_balance || 0
      );
    }

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

      previousAmountDP,
      previousContractAmountDP,
      previousPPNDP,
      previousProofFilePathDP,
      previousPaymentDateDP,
      previousPaymentNumberDP,
      previousRemainingBalanceDP,

      previousAmount1,
      previousContractAmount1,
      previousPPN1,
      previousProofFilePath1,
      previousPaymentDate1,
      previousPaymentNumber1,
      previousRemainingBalance1,

      previousAmount2,
      previousContractAmount2,
      previousPPN2,
      previousProofFilePath2,
      previousPaymentDate2,
      previousPaymentNumber2,
      previousRemainingBalance2,

      previousAmount3,
      previousContractAmount3,
      previousPPN3,
      previousProofFilePath3,
      previousPaymentDate3,
      previousPaymentNumber3,
      previousRemainingBalance3,
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

    previousAmountDP,
    previousContractAmountDP,
    previousPPNDP,
    previousProofFilePathDP,
    previousPaymentDateDP,
    previousPaymentNumberDP,
    previousRemainingBalanceDP,

    previousAmount1,
    previousContractAmount1,
    previousPPN1,
    previousProofFilePath1,
    previousPaymentDate1,
    previousPaymentNumber1,
    previousRemainingBalance1,

    previousAmount2,
    previousContractAmount2,
    previousPPN2,
    previousProofFilePath2,
    previousPaymentDate2,
    previousPaymentNumber2,
    previousRemainingBalance2,

    previousAmount3,
    previousContractAmount3,
    previousPPN3,
    previousProofFilePath3,
    previousPaymentDate3,
    previousPaymentNumber3,
    previousRemainingBalance3,
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

    previousAmountDP: 0,
    previousContractAmountDP: 0,
    previousPPNDP: 0,
    previousProofFilePathDP: "",
    previousPaymentDateDP: "",
    previousPaymentNumberDP: 0,
    previousRemainingBalanceDP: 0,

    previousAmount1: 0,
    previousContractAmount1: 0,
    previousPPN1: 0,
    previousProofFilePath1: "",
    previousPaymentDate1: "",
    previousPaymentNumber1: 0,
    previousRemainingBalance1: 0,

    previousAmount2: 0,
    previousContractAmount2: 0,
    previousPPN2: 0,
    previousProofFilePath2: "",
    previousPaymentDate2: "",
    previousPaymentNumber2: 0,
    previousRemainingBalance2: 0,

    previousAmount3: 0,
    previousContractAmount3: 0,
    previousPPN3: 0,
    previousProofFilePath3: "",
    previousPaymentDate3: "",
    previousPaymentNumber3: 0,
    previousRemainingBalance3: 0,
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

                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 300, // batas maksimal biar tidak terlalu besar
                    position: "relative",
                    borderRadius: 2,
                    overflow: "hidden",
                    aspectRatio: "16/9", // bentuk rasio KTP (bisa ubah ke 4/3 kalau butuh)
                    mx: "auto",
                  }}
                >
                  {selectedData?.tenant_application?.ktp_file_path ? (
                    <Image
                      src={
                        selectedData?.tenant_application?.ktp_file_path
                          ? selectedData.tenant_application?.ktp_file_path
                          : ""
                      }
                      alt="ktp"
                      fill // penuh mengikuti container
                      style={{
                        objectFit: "contain", // gambar penuh, proporsional
                      }}
                      onClick={() => setOpenPreview(true)}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        bgcolor: "#f8f8f8",
                        color: "#aaa",
                        fontSize: "12px",
                      }}
                    >
                      Tidak ada gambar
                    </Box>
                  )}
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
                  ? `No. ${selectedData.room?.room_number}`
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
              Detail Tagihan
            </Typography>
          </Grid>

          <Divider
            sx={{
              mb: 0.5,
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
                PPN (11%)
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

          {selectedData?.tenant_application?.payment_type === "cicilan" ? (
            <>
              {/* Detail Pembayaran */}
              {selectedData?.payments?.payment_number === 1 ? (
                <>
                  <InstallmentDetail
                    title="Pembayaran Pertama"
                    paymentNumber="DP"
                    totalPayment={payment_amount}
                    contractAmount={contract_amount}
                    ppnAmount={ppn_amount}
                    totalInstallment={totalPaymentInstallment}
                    remainingBalance={remainingPaymentAfterInstallment}
                  />

                  <Grid container size={12} mt={1}>
                    <Grid size={12}>
                      <Typography
                        sx={{
                          fontSize: 16,
                          fontWeight: "bold",
                          // color: theme.palette.primary.main,
                        }}
                      >
                        Bukti Pembayaran
                      </Typography>
                    </Grid>

                    <Divider
                      sx={{
                        mb: 0.5,
                        width: "100%",
                        borderColor: theme.palette.primary.main,
                      }}
                    />

                    <PaymentProof
                      label="Uang Muka (DP)"
                      handleSwitchImage={() =>
                        handleSwitchImage(
                          "bukti_pembayaran",
                          selectedData?.payments?.proof_file_path
                        )
                      }
                    />
                  </Grid>
                </>
              ) : selectedData?.payments?.payment_number === 2 ? (
                <>
                  <InstallmentDetail
                    title="Pembayaran Pertama"
                    paymentNumber="DP"
                    totalPayment={previousAmountDP}
                    contractAmount={previousContractAmountDP}
                    ppnAmount={previousPPNDP}
                    totalInstallment={previousAmountDP}
                    remainingBalance={previousRemainingBalanceDP}
                  />
                  <InstallmentDetail
                    title="Cicilan (1)"
                    totalPayment={payment_amount}
                    contractAmount={contract_amount}
                    ppnAmount={ppn_amount}
                    totalInstallment={totalPaymentInstallment}
                    remainingBalance={remainingPaymentAfterInstallment}
                  />

                  <Grid container size={12} mt={1}>
                    <Grid size={12}>
                      <Typography
                        sx={{
                          fontSize: 16,
                          fontWeight: "bold",
                          // color: theme.palette.primary.main,
                        }}
                      >
                        Bukti Pembayaran
                      </Typography>
                    </Grid>

                    <Divider
                      sx={{
                        mb: 0.5,
                        width: "100%",
                        borderColor: theme.palette.primary.main,
                      }}
                    />
                    <Grid container spacing={0.5} size={12}>
                      <PaymentProof
                        label="Uang Muka (DP)"
                        handleSwitchImage={() =>
                          handleSwitchImage(
                            "bukti_pembayaran",
                            previousProofFilePathDP
                          )
                        }
                      />

                      <PaymentProof
                        label="Cicilan (1)"
                        handleSwitchImage={() =>
                          handleSwitchImage(
                            "bukti_pembayaran",
                            selectedData?.payments?.proof_file_path
                          )
                        }
                      />
                    </Grid>
                  </Grid>
                </>
              ) : selectedData?.payments?.payment_number === 3 ? (
                <>
                  <InstallmentDetail
                    title="Pembayaran Pertama"
                    paymentNumber="DP"
                    totalPayment={previousAmountDP}
                    contractAmount={previousContractAmountDP}
                    ppnAmount={previousPPNDP}
                    totalInstallment={previousAmountDP}
                    remainingBalance={previousRemainingBalanceDP}
                  />
                  <InstallmentDetail
                    title="Cicilan (1)"
                    totalPayment={previousAmount1}
                    contractAmount={previousContractAmount1}
                    ppnAmount={previousPPN1}
                    totalInstallment={previousAmount1}
                    remainingBalance={previousRemainingBalance1}
                  />
                  <InstallmentDetail
                    title="Cicilan (2)"
                    totalPayment={payment_amount}
                    contractAmount={contract_amount}
                    ppnAmount={ppn_amount}
                    totalInstallment={totalPaymentInstallment}
                    remainingBalance={remainingPaymentAfterInstallment}
                  />

                  <Grid container size={12} mt={1}>
                    <Grid size={12}>
                      <Typography
                        sx={{
                          fontSize: 16,
                          fontWeight: "bold",
                          // color: theme.palette.primary.main,
                        }}
                      >
                        Bukti Pembayaran
                      </Typography>
                    </Grid>

                    <Divider
                      sx={{
                        mb: 0.5,
                        width: "100%",
                        borderColor: theme.palette.primary.main,
                      }}
                    />
                    <Grid container spacing={0.5} size={12}>
                      <PaymentProof
                        label="Uang Muka (DP)"
                        handleSwitchImage={() =>
                          handleSwitchImage(
                            "bukti_pembayaran",
                            previousProofFilePathDP
                          )
                        }
                      />

                      <PaymentProof
                        label="Cicilan (1)"
                        handleSwitchImage={() =>
                          handleSwitchImage(
                            "bukti_pembayaran",
                            previousProofFilePath1
                          )
                        }
                      />

                      <PaymentProof
                        label="Cicilan (2)"
                        handleSwitchImage={() =>
                          handleSwitchImage(
                            "bukti_pembayaran",
                            selectedData?.payments?.proof_file_path
                          )
                        }
                      />
                    </Grid>
                  </Grid>
                </>
              ) : (
                <>
                  <InstallmentDetail
                    title="Pembayaran Pertama"
                    paymentNumber="DP"
                    totalPayment={previousAmountDP}
                    contractAmount={previousContractAmountDP}
                    ppnAmount={previousPPNDP}
                    totalInstallment={previousAmountDP}
                    remainingBalance={previousRemainingBalanceDP}
                  />
                  <InstallmentDetail
                    title="Cicilan (1)"
                    totalPayment={previousAmount1}
                    contractAmount={previousContractAmount1}
                    ppnAmount={previousPPN1}
                    totalInstallment={previousAmount1}
                    remainingBalance={previousRemainingBalance1}
                  />
                  <InstallmentDetail
                    title="Cicilan (2)"
                    totalPayment={previousAmount2}
                    contractAmount={previousContractAmount2}
                    ppnAmount={previousPPN2}
                    totalInstallment={previousAmount2}
                    remainingBalance={previousRemainingBalance2}
                  />
                  <InstallmentDetail
                    title="Cicilan (3)"
                    totalPayment={payment_amount}
                    contractAmount={contract_amount}
                    ppnAmount={ppn_amount}
                    totalInstallment={totalPaymentInstallment}
                    remainingBalance={remainingPaymentAfterInstallment}
                  />

                  <Grid container size={12} mt={1}>
                    <Grid size={12}>
                      <Typography
                        sx={{
                          fontSize: 16,
                          fontWeight: "bold",
                          // color: theme.palette.primary.main,
                        }}
                      >
                        Bukti Pembayaran
                      </Typography>
                    </Grid>

                    <Divider
                      sx={{
                        mb: 0.5,
                        width: "100%",
                        borderColor: theme.palette.primary.main,
                      }}
                    />
                    <Grid container spacing={0.5} size={12}>
                      <PaymentProof
                        label="Uang Muka (DP)"
                        handleSwitchImage={() =>
                          handleSwitchImage(
                            "bukti_pembayaran",
                            previousProofFilePathDP
                          )
                        }
                      />

                      <PaymentProof
                        label="Cicilan (1)"
                        handleSwitchImage={() =>
                          handleSwitchImage(
                            "bukti_pembayaran",
                            previousProofFilePath1
                          )
                        }
                      />

                      <PaymentProof
                        label="Cicilan (2)"
                        handleSwitchImage={() =>
                          handleSwitchImage(
                            "bukti_pembayaran",
                            previousProofFilePath2
                          )
                        }
                      />

                      <PaymentProof
                        label="Cicilan (3)"
                        handleSwitchImage={() =>
                          handleSwitchImage(
                            "bukti_pembayaran",
                            selectedData?.payments?.proof_file_path
                          )
                        }
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </>
          ) : (
            <Grid container size={12} mt={2}>
              <Grid size={12}>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: "bold",
                    // color: theme.palette.primary.main,
                  }}
                >
                  Bukti Pembayaran
                </Typography>
              </Grid>

              <Divider
                sx={{
                  mb: 0.5,
                  width: "100%",
                  borderColor: theme.palette.primary.main,
                }}
              />
              <Grid container spacing={0.5} size={12}>
                <PaymentProof
                  label="Pembayaran Lunas"
                  handleSwitchImage={() =>
                    handleSwitchImage(
                      "bukti_pembayaran",
                      selectedData?.payments?.proof_file_path
                    )
                  }
                />
              </Grid>
            </Grid>
          )}

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
