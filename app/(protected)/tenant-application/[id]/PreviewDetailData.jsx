"use client";

import formatRupiah from "@/app/components/formatrupiah/page";
import ImagePreviewModal from "@/app/components/imagepreviewmodal/page";
import ApprovedOverlay from "@/app/components/tenantapplicationmodal/ApprovedOverlay";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import moment from "moment";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { getUploadApiUrl } from "@/app/utils/uploadPath";

const PreviewDetailData = ({ data }) => {
  const router = useRouter();
  const theme = useTheme();
  const { themeMode } = useThemeMode();
  const isMobile = useMediaQuery("(max-width:600px)");

  const [openPreview, setOpenPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ktpImageUrl = getUploadApiUrl(data?.ktp_file_path);

  const installments = [
    {
      label: data?.estimated_installment_1
        ? `Cicilan 1 (Bulan ${moment(data?.estimated_installment_1_date).format(
            "MMM YYYY",
          )})`
        : "Pilih tanggal pembayaran",
      amount: formatRupiah(data?.estimated_installment_1),
    },
    {
      label: data?.estimated_installment_2
        ? `Cicilan 2 (Bulan ${moment(data?.estimated_installment_2_date).format(
            "MMM YYYY",
          )})`
        : "Pilih tanggal pembayaran",
      amount: formatRupiah(data?.estimated_installment_2),
    },
    {
      label: data?.estimated_installment_3
        ? `Cicilan 3 (Bulan ${moment(data?.estimated_installment_3_date).format(
            "MMM YYYY",
          )})`
        : "Pilih tanggal pembayaran",
      amount: formatRupiah(data?.estimated_installment_3),
    },
  ];

  const handleCalculateTotal = () => {
    // Konversi nilai ke number
    const totalPayment = Number(data?.total_payment || 0);
    const downPayment = Number(data?.down_payment || 0);
    const installment1 = Number(data?.estimated_installment_1 || 0);
    const installment2 = Number(data?.estimated_installment_2 || 0);
    const installment3 = Number(data?.estimated_installment_3 || 0);
    const remainingPayment = Number(data?.remaining_payment || 0);

    const totalSewaKontrakRuangan = data?.price_per_m2 * data?.room_area;

    // Hitung Nilai Kontrak
    const nilaiKontrak = downPayment / 1.11;

    // Hitung PPN Down Payment
    const PPNDownPayment = nilaiKontrak * 0.11;

    // Hitung total PPN
    const totalPPN = totalSewaKontrakRuangan * 0.11;

    // Total cicilan semua + PPN
    const totalInstallment = installment1 + installment2 + installment3;

    return {
      totalPayment,
      totalSewaKontrakRuangan,
      PPNDownPayment,
      nilaiKontrak,
      totalPPN,
      totalInstallment,
      remainingPayment,
      downPayment,
    };
  };

  const {
    totalPayment,
    totalSewaKontrakRuangan,
    PPNDownPayment,
    nilaiKontrak,
    totalPPN,
    totalInstallment,
    remainingPayment,
    downPayment,
  } = handleCalculateTotal() || {
    totalPayment: 0,
    totalSewaKontrakRuangan: 0,
    PPNDownPayment: 0,
    nilaiKontrak: 0,
    totalPPN: 0,
    totalInstallment: 0,
    remainingPayment: 0,
    downPayment: 0,
  };

  return (
    <Box sx={{ p: isMobile ? 3 : 5 }}>
      <Button
        variant={"contained"}
        size="small"
        onClick={() => router.back()}
        color="error"
        sx={{
          textTransform: "none",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          fontWeight: "bold",
          mb: 3,
        }}
      >
        Kembali
      </Button>

      <Paper
        elevation={6}
        sx={{
          backgroundColor: "background.default",
          p: 3,
          borderRadius: "10px",
        }}
      >
        <Grid container spacing={1}>
          <Typography
            sx={{
              fontSize: isMobile ? 15 : 16,
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
                  fontSize: isMobile ? "14px" : "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Nama Penyewa
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "13px" : "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {data?.tenant_name ? data.tenant_name : "-"}
              </Typography>
            </Grid>

            <Grid
              size={isMobile ? 6 : 12}
              sx={{ display: "flex", flexDirection: "column" }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "14px" : "15px",
                  color: theme.palette.primary.main,
                }}
              >
                NIK
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "13px" : "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {data?.tenant_nik ? data.tenant_nik : "-"}
              </Typography>
            </Grid>

            <Grid
              size={isMobile ? 6 : 12}
              sx={{ display: "flex", flexDirection: "column" }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "14px" : "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Nomor Telepon
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "13px" : "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {data?.tenant_phone ? data.tenant_phone : "-"}
              </Typography>
            </Grid>
          </Grid>
          <Grid container size={isMobile ? 12 : 6} spacing={2}>
            <Grid size={12} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "14px" : "15px",
                  color: theme.palette.primary.main,
                  mb: 0.5,
                }}
              >
                Foto KTP
              </Typography>

              {/* Container dina */}
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 400, // batas maksimal biar tidak terlalu besar
                  position: "relative",
                  borderRadius: 2,
                  overflow: "hidden",
                  aspectRatio: "16/9", // bentuk rasio KTP (bisa ubah ke 4/3 kalau butuh)
                  mx: "auto",
                }}
              >
                {data?.ktp_file_path ? (
                  <Image
                    src={ktpImageUrl}
                    alt="ktp"
                    fill // penuh mengikuti container
                    style={{
                      objectFit: "contain", // gambar penuh, proporsional
                    }}
                    priority
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
                  mt: 1,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
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
        <Grid container spacing={2} mt={4}>
          <Typography
            sx={{
              fontSize: isMobile ? 15 : 16,
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
                fontSize: isMobile ? "14px" : "15px",
                color: theme.palette.primary.main,
              }}
            >
              Nama Lokasi
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "13px" : "14px",
                wordBreak: "break-word", // <-- biar kata panjang pecah
                whiteSpace: "normal", // <-- biar bisa turun baris
                overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
              }}
            >
              {data?.location_name ? data.location_name : "-"}
            </Typography>
          </Grid>

          <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "14px" : "15px",
                color: theme.palette.primary.main,
              }}
            >
              Lantai
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "13px" : "14px",
                wordBreak: "break-word", // <-- biar kata panjang pecah
                whiteSpace: "normal", // <-- biar bisa turun baris
                overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
              }}
            >
              {data?.floor ? data.floor : "-"}
            </Typography>
          </Grid>

          <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "14px" : "15px",
                color: theme.palette.primary.main,
              }}
            >
              Ruangan
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "13px" : "14px",
                wordBreak: "break-word", // <-- biar kata panjang pecah
                whiteSpace: "normal", // <-- biar bisa turun baris
                overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
              }}
            >
              {data?.room_number ? `No. ${data.room_number}` : "-"}
            </Typography>
          </Grid>

          <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "14px" : "15px",
                color: theme.palette.primary.main,
              }}
            >
              Panjang (m)
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "13px" : "14px",
                wordBreak: "break-word", // <-- biar kata panjang pecah
                whiteSpace: "normal", // <-- biar bisa turun baris
                overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
              }}
            >
              {data?.room_length ? data.room_length : "-"} M
            </Typography>
          </Grid>

          <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "14px" : "15px",
                color: theme.palette.primary.main,
              }}
            >
              Lebar (m)
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "13px" : "14px",
                wordBreak: "break-word", // <-- biar kata panjang pecah
                whiteSpace: "normal", // <-- biar bisa turun baris
                overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
              }}
            >
              {data?.room_width ? data.room_width : "-"} M
            </Typography>
          </Grid>

          <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "14px" : "15px",
                color: theme.palette.primary.main,
              }}
            >
              Luas (m²)
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "13px" : "14px",
                wordBreak: "break-word", // <-- biar kata panjang pecah
                whiteSpace: "normal", // <-- biar bisa turun baris
                overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
              }}
            >
              {data?.room_area ? data.room_area + " M" : "-"}
            </Typography>
          </Grid>

          <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "14px" : "15px",
                color: theme.palette.primary.main,
              }}
            >
              Harga Ruangan (m)
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "13px" : "14px",
                wordBreak: "break-word", // <-- biar kata panjang pecah
                whiteSpace: "normal", // <-- biar bisa turun baris
                overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
              }}
            >
              {data?.price_per_m2 ? formatRupiah(data.price_per_m2) : "-"}
            </Typography>
          </Grid>

          <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "14px" : "15px",
                color: theme.palette.primary.main,
              }}
            >
              Tanggal Dibuat
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "13px" : "14px",
                wordBreak: "break-word", // <-- biar kata panjang pecah
                whiteSpace: "normal", // <-- biar bisa turun baris
                overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
              }}
            >
              {data?.created_at
                ? moment(data.created_at).format("YYYY/MM/DD")
                : "-"}
            </Typography>
          </Grid>

          <Grid size={12} sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "14px" : "15px",
                color: theme.palette.primary.main,
              }}
            >
              Masa Berlaku
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "13px" : "14px",
                wordBreak: "break-word", // <-- biar kata panjang pecah
                whiteSpace: "normal", // <-- biar bisa turun baris
                overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
              }}
            >
              {data?.start_date && data?.end_date
                ? moment(data.start_date).format("YYYY/MM/DD") +
                  " s/d " +
                  moment(data.end_date).format("YYYY/MM/DD")
                : "Pendaftaran Baru"}
            </Typography>
          </Grid>
        </Grid>

        {/* Detail Biaya */}
        <Grid container spacing={2} mt={4}>
          <Typography
            sx={{
              fontSize: isMobile ? 15 : 16,
              fontWeight: "bold",
              // color: theme.palette.primary.main,
            }}
          >
            Detail Biaya
          </Typography>
        </Grid>

        <Divider
          sx={{
            mb: 0.5,
            borderColor: theme.palette.primary.main,
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
              fontSize: isMobile ? "13px" : "14px",
            }}
          >
            Tipe Pembayaran
          </Typography>
          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: isMobile ? "13px" : "14px",
              wordBreak: "break-word", // <-- biar kata panjang pecah
              whiteSpace: "normal", // <-- biar bisa turun baris
              overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
            }}
          >
            {data?.payment_type === "cicilan" ? "Cicilan" : "Lunas"}
          </Typography>
        </Grid>

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
                fontSize: isMobile ? "13px" : "14px",
              }}
            >
              Total Sewa Kontrak Ruangan
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "13px" : "14px",
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
                fontSize: isMobile ? "13px" : "14px",
              }}
            >
              Iuran Jasa Administrasi
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "13px" : "14px",
                wordBreak: "break-word", // <-- biar kata panjang pecah
                whiteSpace: "normal", // <-- biar bisa turun baris
                overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
              }}
            >
              {/* {data?.total_payment
                ? formatRupiah(data.total_payment)
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
                fontSize: isMobile ? "13px" : "14px",
              }}
            >
              PPN 11%
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "13px" : "14px",
                wordBreak: "break-word", // <-- biar kata panjang pecah
                whiteSpace: "normal", // <-- biar bisa turun baris
                overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
              }}
            >
              {formatRupiah(totalPPN)}
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
        <Grid container>
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
                fontSize: isMobile ? "13px" : "14px",
              }}
            >
              Total Pembayaran
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: isMobile ? "13px" : "14px",
                wordBreak: "break-word", // <-- biar kata panjang pecah
                whiteSpace: "normal", // <-- biar bisa turun baris
                overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
              }}
            >
              {/* {data?.total_payment
                ? formatRupiah(data.total_payment)
                : "-"} */}{" "}
              {totalPayment ? formatRupiah(totalPayment) : "-"}
            </Typography>
          </Grid>
        </Grid>

        <Divider
          sx={{
            mb: 4,
            mt: 0.5,
            borderColor: theme.palette.primary.main,
          }}
        />

        {data?.payment_type === "cicilan" && (
          <>
            <Grid size={12}>
              <Typography
                sx={{
                  fontSize: isMobile ? 15 : 16,
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
                  fontSize: isMobile ? "13px" : "14px",
                }}
              >
                Uang Muka (DP)
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "13px" : "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {data?.down_payment ? formatRupiah(data?.down_payment) : "-"}
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
                  fontSize: isMobile ? "13px" : "14px",
                }}
              >
                Nilai Kontrak
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "13px" : "14px",
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
                  fontSize: isMobile ? "13px" : "14px",
                }}
              >
                PPN 11%
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "13px" : "14px",
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
                  fontSize: isMobile ? "13px" : "14px",
                }}
              >
                Total Pembayaran
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "13px" : "14px",
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
                mb: 4,
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "13px" : "14px",
                }}
              >
                Sisa Pembayaran
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "13px" : "14px",
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

            {installments.slice(0, data?.current_tenor).map((item, index) => (
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
                    fontSize: isMobile ? "13px" : "14px",
                  }}
                >
                  {item?.label}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: isMobile ? "13px" : "14px",
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
                    fontSize: isMobile ? "13px" : "14px",
                  }}
                >
                  Total Cicilan
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: isMobile ? "13px" : "14px",
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

        {/* Modal Preview Gambar */}
        <ImagePreviewModal
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          imageUrl={ktpImageUrl}
          alt="Preview KTP"
        />

        {data?.approval_status === "approved" ? (
          <ApprovedOverlay data={data} />
        ) : (
          ""
        )}
      </Paper>
    </Box>
  );
};

export default PreviewDetailData;
