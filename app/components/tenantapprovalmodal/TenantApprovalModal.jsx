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
import ApprovedOverlay from "./ApprovedOverlay";
import Image from "next/image";
import { getUploadApiUrl } from "@/app/utils/uploadPath";
import { buildPaymentDetail } from "@/app/utils/buildPaymentDetail";

const TenantApprovalModal = ({
  open,
  onClose,
  selectedData,
  loadingTrue,
  loadingFalse,
  onNotify,
  getDataApprovals = () => {},
  user,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  const [openPreview, setOpenPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // console.log("selectedData", selectedData);
  const theme = useTheme();
  const ktpImageUrl = getUploadApiUrl(selectedData?.ktp_file_path);

  const installments = [
    {
      label: selectedData?.estimated_installment_1
        ? `Cicilan 1 (Bulan ${moment(
            selectedData?.estimated_installment_1_date
          ).format("MMM YYYY")})`
        : "Pilih tanggal pembayaran",
      amount: formatRupiah(selectedData?.estimated_installment_1),
    },
    {
      label: selectedData?.estimated_installment_2
        ? `Cicilan 2 (Bulan ${moment(
            selectedData?.estimated_installment_2_date
          ).format("MMM YYYY")})`
        : "Pilih tanggal pembayaran",
      amount: formatRupiah(selectedData?.estimated_installment_2),
    },
    {
      label: selectedData?.estimated_installment_3
        ? `Cicilan 3 (Bulan ${moment(
            selectedData?.estimated_installment_3_date
          ).format("MMM YYYY")})`
        : "Pilih tanggal pembayaran",
      amount: formatRupiah(selectedData?.estimated_installment_3),
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
    transition: "box-shadow 0.3s",
    //hide scrollbar
    "&::-webkit-scrollbar": {
      display: "none",
    },
    position: "relative",
  };

  const {
    totalPayment,
    annualRoomRent,
    leaseDurationYears,
    totalSewaKontrakRuangan,
    PPNDownPayment,
    nilaiKontrak,
    totalPPN,
    downPayment,
    totalInstallment,
    remainingPayment,
  } = buildPaymentDetail(selectedData) || {
    totalPayment: 0,
    annualRoomRent: 0,
    leaseDurationYears: 1,
    totalSewaKontrakRuangan: 0,
    PPNDownPayment: 0,
    nilaiKontrak: 0,
    totalPPN: 0,
    downPayment: 0,
    totalInstallment: 0,
    remainingPayment: 0,
  };

  const handleSubmit = async () => {
    loadingTrue();
    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `/api/tenant-approval/${selectedData?.id}`,
        {
          tenant_application_id: selectedData?.tenant_application_id,
          status: "approved",
          approver_id: user.id,
        }
      );
      // console.log("response", response.data);

      if (response.data.success) {
        onNotify?.({
          open: true,
          message: response.data.message || "Berhasil Menyetujui Sewa Ruangan!",
          severity: "success",
        });
        getDataApprovals();
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
                  {selectedData?.tenant_name ? selectedData.tenant_name : "-"}
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
                  {selectedData?.tenant_nik ? selectedData.tenant_nik : "-"}
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
                  {selectedData?.tenant_phone ? selectedData.tenant_phone : "-"}
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
                  {selectedData?.ktp_file_path ? (
                    <Image
                      src={ktpImageUrl}
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

          {/* Detail Lokasi & Ruangan */}
          <Grid container spacing={2} mt={2}>
            <Typography
              sx={{
                fontSize: 15,
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
                Nama Lokasi
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
                {selectedData?.location_name ? selectedData.location_name : "-"}
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
                {selectedData?.floor ? selectedData.floor : "-"}
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
                {selectedData?.room_number
                  ? `No. ${selectedData.room_number}`
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
                {selectedData?.room_length ? selectedData.room_length : "-"} M
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
                {selectedData?.room_width ? selectedData.room_width : "-"} M
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
                Luas (m²)
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
                {selectedData?.room_area ? selectedData.room_area + " M" : "-"}
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
                Harga Ruangan (m)
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
                {selectedData?.price_per_m2
                  ? formatRupiah(selectedData.price_per_m2)
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
                Tanggal Dibuat
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
                {selectedData?.created_at
                  ? moment(selectedData.created_at).format("YYYY/MM/DD")
                  : "-"}
              </Typography>
            </Grid>

            <Grid size={12} sx={{ display: "flex", flexDirection: "column" }}>
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
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.start_date && selectedData?.end_date
                  ? moment(selectedData.start_date).format("YYYY/MM/DD") +
                    " s/d " +
                    moment(selectedData.end_date).format("YYYY/MM/DD")
                  : "Pendaftaran Baru"}
              </Typography>
            </Grid>
          </Grid>

          {/* Rincian Pembayaran */}
          <Grid container spacing={2} mt={2}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: "bold",
                // color: theme.palette.primary.main,
              }}
            >
              Rincian Pembayaran
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
                {selectedData?.payment_type === "cicilan" ? "Cicilan" : "Lunas"}
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
                Harga Sewa per Tahun
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
                {annualRoomRent ? formatRupiah(annualRoomRent) : "-"}
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
                Durasi Sewa
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
                {leaseDurationYears} Tahun
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
                {totalPayment ? formatRupiah(totalPayment) : "-"}
              </Typography>
            </Grid>
          </Grid>

          <Divider
            sx={{
              borderColor: theme.palette.primary.main,
              width: "100%",
              mb: 2,
              mt: 0.5,
            }}
          />

          {selectedData?.payment_type === "cicilan" && (
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
                  {selectedData?.down_payment
                    ? formatRupiah(selectedData?.down_payment)
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
                  {downPayment ? formatRupiah(downPayment) : "-"}
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

              {/* Rencana Cicilan */}
              <Grid container spacing={2} mt={2}>
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: "bold",
                    // color: theme.palette.primary.main,
                  }}
                >
                  Rencana Cicilan
                </Typography>
              </Grid>

              <Divider
                sx={{
                  mb: 0.5,
                  borderColor: theme.palette.primary.main,
                }}
              />

              {installments
                .slice(0, selectedData?.current_tenor)
                .map((item, index) => (
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
                  mb: 0.5,
                  mt: 0.5,
                  borderColor: theme.palette.primary.main,
                }}
              />

              {/* Total Cicilan */}
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
                    {totalInstallment ? formatRupiah(totalInstallment) : "-"}
                  </Typography>
                </Grid>
              </Grid>

              <Divider
                sx={{
                  mt: 0.5,
                  borderColor: theme.palette.primary.main,
                }}
              />
            </>
          )}

          <Grid
            container
            spacing={1}
            sx={{
              mt: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Grid
              size={
                selectedData?.status === "approved" ||
                selectedData?.status === "rejected"
                  ? 12
                  : 6
              }
            >
              <Button
                type="submit"
                variant="contained"
                color="error"
                size="small"
                sx={{
                  fontWeight: "bold",
                  fontSize: 16,
                  textTransform: "none",
                  width:
                    selectedData?.status === "approved" ||
                    selectedData?.status === "rejected"
                      ? "100%"
                      : 150,
                }}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
            </Grid>
            <Grid size={6} sx={{ textAlign: "right" }}>
              {selectedData?.status === "approved" ||
              selectedData?.status === "rejected" ? (
                ""
              ) : (
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
              )}
            </Grid>
          </Grid>

          {/* Modal Preview Gambar */}
          <ImagePreviewModal
            open={openPreview}
            onClose={() => setOpenPreview(false)}
            imageUrl={ktpImageUrl}
            alt="Preview KTP"
          />

          {selectedData?.status === "approved" ||
          selectedData?.status === "rejected" ? (
            <ApprovedOverlay selectedData={selectedData} />
          ) : (
            ""
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default TenantApprovalModal;
