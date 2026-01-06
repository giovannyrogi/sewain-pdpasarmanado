"use client";
import { Box, Divider, Grid, Typography } from "@mui/material";
import moment from "moment";
import React, { forwardRef } from "react";
import formatRupiah from "../formatrupiah/page";
import Image from "next/image";

const PersetujuanSewaRuangan = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const handleCalculateTotal = () => {
    // Konversi nilai ke number
    const totalPayment = Number(data?.total_payment || 0);
    const downPayment = Number(data?.down_payment || 0);
    const installment1 = Number(data?.estimated_installment_1 || 0);
    const installment2 = Number(data?.estimated_installment_2 || 0);
    const installment3 = Number(data?.estimated_installment_3 || 0);
    const remainingPayment = Number(data?.remaining_payment || 0);
    const roomPrice = Number(data?.price_per_m2 || 0);
    const roomArea = Number(data?.room_area || 0);

    const totalSewaKontrakRuangan = roomPrice * roomArea;

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

    // Total cicilan semua + PPN
    const totalInstallment = installment1 + installment2 + installment3;

    return {
      totalPayment,
      totalSewaKontrakRuangan,
      PPNDownPayment,
      totalDownPayment,
      nilaiKontrak,
      totalPPN,
      grandTotal,
      totalInstallment,
      remainingPayment,
    };
  };

  const {
    totalPayment,
    totalSewaKontrakRuangan,
    PPNDownPayment,
    totalDownPayment,
    nilaiKontrak,
    totalPPN,
    grandTotal,
    totalInstallment,
    remainingPayment,
  } = handleCalculateTotal() || {
    totalPayment: 0,
    totalSewaKontrakRuangan: 0,
    PPNDownPayment: 0,
    totalDownPayment: 0,
    nilaiKontrak: 0,
    totalPPN: 0,
    grandTotal: 0,
    totalInstallment: 0,
    remainingPayment: 0,
  };

  return (
    <Box ref={ref} sx={{ padding: "10px 30px 0px 30px" }}>
      {/* Headers */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            mt: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: "35px",
              fontWeight: "bold",
              fontFamily: "Bernard MT Condensed bold",
            }}
          >
            PERUSAHAAN UMUM DAERAH
          </Typography>
          <Typography
            sx={{
              fontSize: "35px",
              fontWeight: "bold",
              fontFamily: "Bernard MT Condensed bold",
              mt: -2,
            }}
          >
            PASAR MANADO
          </Typography>
          <Typography
            sx={{
              fontSize: "9px",
              textAlign: "center",
              fontFamily: "agency fb regular",
            }}
          >
            Kompleks Gedung Shoping Center Lt. II Manado, Jl. Walanda Maramis
            No. 123, Kel. Pinaesaan, Kec. Wenang Kota Manado
          </Typography>
        </Box>
      </Box>

      {/* Garis Pembatas */}
      <Divider
        sx={{
          borderColor: "black",
          mb: "1px",
        }}
      />
      <Divider
        sx={{
          borderWidth: "1px",
          borderColor: "black",
        }}
      />

      {/* Tanggal Dokumen */}
      <Grid container spacing={2} mt={0.3}>
        <Grid size={7.3} display={"flex"} flexDirection={"row"} gap={3}></Grid>
        <Grid size={4.7}>
          <Typography sx={{ fontSize: "13px", fontFamily: "calibri" }}>
            {`Manado, ${moment(new Date()).format("D MMMM YYYY")}`}
          </Typography>
        </Grid>
      </Grid>

      {/* Content */}
      <Box
        sx={{
          width: "100%",
          mt: "5px",
        }}
      >
        {/* Nomor  */}
        <Grid container spacing={2}>
          <Grid size={7.3} display={"flex"} flexDirection={"row"} gap={5}>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              Nomor
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              : {data.document_number ? data.document_number : "-"}
            </Typography>
          </Grid>
          <Grid size={4.7}>
            <Typography sx={{ fontSize: "13px", fontFamily: "calibri" }}>
              Kepada Yth.
            </Typography>
          </Grid>
        </Grid>

        {/* Lampiran + Tenant Name */}
        <Grid container spacing={2}>
          <Grid size={7.3} display={"flex"} flexDirection={"row"} gap={3.2}>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              Lampiran
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
                marginLeft: "2px",
                fontFamily: "calibri",
              }}
            >
              : -
            </Typography>
          </Grid>
          <Grid size={4.7}>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: "bold",
                fontFamily: "calibri",
              }}
            >
              {data.tenant_name ? data.tenant_name : "-"}
            </Typography>
          </Grid>
        </Grid>

        {/* Titik */}
        <Grid container spacing={2}>
          <Grid size={7.3}></Grid>
          <Grid size={4.7}>
            <Typography sx={{ fontSize: "13px" }}>
              .......................................................
            </Typography>
          </Grid>
        </Grid>

        {/* Perihal + Di tempat */}
        <Grid container spacing={2}>
          <Grid size={7.3} display={"flex"} flexDirection={"row"} gap={5}>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              Perihal
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              :{" "}
              <span style={{ fontWeight: "bold", fontFamily: "calibri" }}>
                Persetujuan Sewa Ruangan
              </span>
            </Typography>
          </Grid>
          <Grid size={4.7}>
            <Typography sx={{ fontSize: "13px", fontFamily: "calibri" }}>
              di - tempat
            </Typography>
          </Grid>
        </Grid>

        {/* Content */}
        <Grid container mt={2}>
          <Grid size={12}>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              Dengan hormat,
            </Typography>
          </Grid>
          <Grid size={12}>
            <Typography
              sx={{
                fontSize: "13px",
                textAlign: "justify",
                fontFamily: "calibri",
              }}
            >
              Pertama-tama kami ucapakan terima kasih atas kepercayaan Bpk/Ibu
              untuk menjalin kerjasama sebagai mitra Perumda Pasar Manado.
              Berkenaan dengan permohonan Bpk/Ibu terkait sewa ruangan dengan
              data sebagai berikut :
            </Typography>
          </Grid>

          {/* Data Diri */}
          {/* Nama Penyewa */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={6.1}>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              Nama Penyewa
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
                ml: "1px",
                fontFamily: "calibri",
              }}
            >
              :{" "}
              <span style={{ fontWeight: "bold" }}>
                {data.tenant_name ? data.tenant_name : "-"}
              </span>
            </Typography>
          </Grid>
          {/* No. Ruangan */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={8}>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              No. Ruangan
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              :{" "}
              <span style={{ fontWeight: "bold" }}>
                {data.room_number ? `No. ${data.room_number}` : "-"}
              </span>
            </Typography>
          </Grid>
          {/* Ukuran Ruangan */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={4.7}>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              Ukurang Ruangan
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
              }}
            >
              :{" "}
              <span style={{ fontWeight: "bold", fontFamily: "calibri" }}>
                {data.room_length && data.room_width
                  ? `${data.room_length} M X ${data.room_width} M`
                  : "-"}
              </span>
            </Typography>
          </Grid>

          {/* Lokasi */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={7.4}>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              Lokasi / Pasar
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              :{" "}
              <span style={{ fontWeight: "bold" }}>
                {data.location_name ? data.location_name : "-"}
              </span>
            </Typography>
          </Grid>

          {/* Jangka Waktu */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={7.3}>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              Jangka Waktu
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              :{" "}
              <span style={{ fontWeight: "bold", fontFamily: "calibri" }}>
                {data.start_date && data.end_date
                  ? `1 TAHUN (${moment(data.start_date).format(
                      "D MMMM YYYY"
                    )} S/D ${moment(data.end_date).format("D MMMM YYYY")})`
                  : "-"}
              </span>
            </Typography>
          </Grid>

          {/* Detail Biaya */}
          <Grid size={12}>
            <Typography
              sx={{
                fontSize: "13px",
                textAlign: "justify",
                fontFamily: "calibri",
              }}
            >
              Pada prinsipnya pembayaran dapat kami setujui, dengan membayar{" "}
              <strong>menyicil</strong> sebagai berikut :
            </Typography>
          </Grid>

          {/* Sewa Kontrak Ruangan */}
          <Grid container size={12}>
            <Grid size={3} display={"flex"} flexDirection={"row"} gap={3.2}>
              <Typography
                sx={{
                  fontSize: "13px",
                  textAlign: "justify",
                  fontFamily: "calibri",
                }}
              >
                <span style={{ marginRight: "10px", fontFamily: "calibri" }}>
                  1.
                </span>
                Sewa Kontrak Ruangan
              </Typography>
            </Grid>
            <Grid
              size={2}
              display={"flex"}
              flexDirection={"column"}
              alignItems={"end"}
            >
              <Typography
                sx={{
                  fontSize: "13px",
                  textAlign: "justify",
                  fontWeight: "bold",
                  fontFamily: "calibri",
                }}
              >
                {totalSewaKontrakRuangan
                  ? formatRupiah(totalSewaKontrakRuangan)
                  : "-"}
                , -
              </Typography>
            </Grid>
          </Grid>

          {/* Iuran Jasa Administrasi */}
          <Grid container size={12}>
            <Grid size={3} display={"flex"} flexDirection={"row"} gap={3.2}>
              <Typography
                sx={{
                  fontSize: "13px",
                  textAlign: "justify",
                  fontFamily: "calibri",
                }}
              >
                <span
                  style={{ marginRight: "20px", fontFamily: "calibri" }}
                ></span>
                Iuran Jasa Administrasi
              </Typography>
            </Grid>
            <Grid
              size={2}
              display={"flex"}
              flexDirection={"column"}
              alignItems={"end"}
            >
              <Typography
                sx={{
                  fontSize: "13px",
                  textAlign: "justify",
                  fontWeight: "bold",
                  fontFamily: "calibri",
                }}
              >
                {formatRupiah(50000)}, -
              </Typography>
            </Grid>
          </Grid>

          {/* By. Asuransi objek kontrak */}
          <Grid container size={12}>
            <Grid size={3} display={"flex"} flexDirection={"row"} gap={3.2}>
              <Typography
                sx={{
                  fontSize: "13px",
                  textAlign: "justify",
                  fontFamily: "calibri",
                }}
              >
                <span style={{ marginRight: "20px" }}></span>By. Asuransi objek
                kontrak
              </Typography>
            </Grid>
            <Grid
              size={2}
              display={"flex"}
              flexDirection={"column"}
              alignItems={"end"}
            >
              <Typography
                sx={{
                  fontSize: "13px",
                  textAlign: "justify",
                  fontWeight: "bold",
                  fontFamily: "calibri",
                }}
              >
                -
              </Typography>
            </Grid>
          </Grid>

          {/* PPN */}
          <Grid container size={12}>
            <Grid size={2} display={"flex"} flexDirection={"row"} gap={3.2}>
              <Typography
                sx={{
                  fontSize: "13px",
                  textAlign: "justify",
                  fontFamily: "calibri",
                }}
              >
                <span
                  style={{ marginRight: "20px", fontFamily: "calibri" }}
                ></span>
                PPN 11%
              </Typography>
            </Grid>
            <Grid
              size={3}
              display={"flex"}
              flexDirection={"column"}
              alignItems={"end"}
            >
              <Typography
                sx={{
                  fontSize: "13px",
                  textAlign: "justify",
                  fontWeight: "bold",
                  fontFamily: "calibri",
                }}
              >
                {totalPPN ? formatRupiah(totalPPN) : "-"}, -
              </Typography>
              <Divider
                sx={{
                  borderColor: "black",
                  width: "100px",
                }}
              />
            </Grid>
          </Grid>

          {/* Jumlah */}
          <Grid container size={12}>
            <Grid size={2} display={"flex"} flexDirection={"row"} gap={3.2}>
              <Typography
                sx={{
                  fontSize: "13px",
                  textAlign: "justify",
                  fontFamily: "calibri",
                }}
              >
                <span style={{ marginRight: "20px" }}></span>Jumlah
              </Typography>
            </Grid>
            <Grid
              size={3}
              display={"flex"}
              flexDirection={"column"}
              alignItems={"end"}
            >
              <Typography
                sx={{
                  fontSize: "13px",
                  textAlign: "justify",
                  fontWeight: "bold",
                  fontFamily: "calibri",
                }}
              >
                {grandTotal ? formatRupiah(grandTotal) : "-"}, -
              </Typography>
            </Grid>
          </Grid>

          {/* Detail Menyicil */}
          {data.payment_type === "cicilan" && (
            <Grid container size={12}>
              <Grid size={2}>
                <Typography
                  sx={{
                    fontSize: "13px",
                    textAlign: "justify",
                    fontWeight: "bold",
                    fontFamily: "calibri",
                  }}
                >
                  <span style={{ marginRight: "20px" }}></span>Menyicil 4x
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography
                  sx={{
                    fontSize: "13px",
                    textAlign: "justify",
                    fontWeight: "bold",
                    fontFamily: "calibri",
                  }}
                >
                  <span style={{ marginRight: "20px" }}></span>-{" "}
                  {formatRupiah(data.down_payment)}, - (Uang Muka)
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography
                  sx={{
                    fontSize: "13px",
                    textAlign: "justify",
                    fontWeight: "bold",
                    fontFamily: "calibri",
                  }}
                >
                  <span style={{ marginRight: "20px" }}></span>-{" "}
                  {formatRupiah(data?.estimated_installment_1)}, - (
                  {moment(data.estimated_installment_1_date).format("MMM YYYY")}
                  )
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography
                  sx={{
                    fontSize: "13px",
                    textAlign: "justify",
                    fontWeight: "bold",
                    fontFamily: "calibri",
                  }}
                >
                  <span style={{ marginRight: "20px" }}></span>-{" "}
                  {formatRupiah(data?.estimated_installment_2)}, - (
                  {moment(data.estimated_installment_2_date).format("MMM YYYY")}
                  )
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography
                  sx={{
                    fontSize: "13px",
                    textAlign: "justify",
                    fontWeight: "bold",
                    fontFamily: "calibri",
                  }}
                >
                  <span style={{ marginRight: "20px" }}></span>-{" "}
                  {formatRupiah(data?.estimated_installment_3)}, - (
                  {moment(data.estimated_installment_3_date).format("MMM YYYY")}
                  )
                </Typography>
              </Grid>
            </Grid>
          )}

          {/* Informasi pembayaran ke Bank */}
          <Grid size={12} mt={1}>
            <Typography
              sx={{
                fontSize: "13px",
                textAlign: "justify",
                fontFamily: "calibri",
              }}
            >
              <span style={{ marginRight: "10px" }}>2.</span>
              Pembayaran sewa kontrak ruangan dapat dilakukan malalui transfer
              ke rekening :
            </Typography>
          </Grid>

          {/* Nama Bank */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={9.4}>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              <span style={{ marginRight: "20px" }}></span> Nama Bank
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
                ml: "1px",
                fontFamily: "calibri",
              }}
            >
              : <span style={{ fontWeight: "bold" }}>Bank SulutGo</span>
            </Typography>
          </Grid>

          {/* Nomor Rekening */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={5.8}>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>Nomor Rekening
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
                ml: "1px",
              }}
            >
              : <span style={{ fontWeight: "bold" }}>011.0123.0000019</span>
            </Typography>
          </Grid>

          {/* Atas Nama */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={9.8}>
            <Typography
              sx={{
                fontSize: "13px",
                fontFamily: "calibri",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>Atas Nama
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
                ml: "1px",
              }}
            >
              :{" "}
              <span style={{ fontWeight: "bold" }}>PD. Pasar Kota Manado</span>
            </Typography>
          </Grid>

          <Grid size={12} mt={1}>
            <Typography
              sx={{
                fontSize: "13px",
                textAlign: "justify",
                fontFamily: "calibri",
              }}
            >
              Iuran Retribusi yang dibayarkan setiap bulan selama jangka waktu
              kontrak. Untuk iuran retribusi, pembayaran dapat dilakukan melalui
              penagih iuran.
            </Typography>
          </Grid>

          <Grid size={12} mt={1}>
            <Typography
              sx={{
                fontSize: "13px",
                textAlign: "justify",
                fontFamily: "calibri",
              }}
            >
              Setelah pembayaran dilakukan, copy bukti transfer dapat segera
              diserahkan ke bagian sewa kontrak untuk diproses penandatanganan
              kontrak ruangan.
            </Typography>
          </Grid>

          <Grid size={12}>
            <Typography
              sx={{
                fontSize: "13px",
                textAlign: "justify",
                fontFamily: "calibri",
              }}
            >
              Demikian kami sampaikan, atas perhatian dan kerjasamanya kami
              ucapkan terima kasih.
            </Typography>
          </Grid>

          {/* TTD Direktur */}
          <Grid container size={12} mt={1}>
            <Grid size={6.5}></Grid>
            <Grid size={5.5}>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  fontFamily: "calibri",
                }}
              >
                Direktur Utama
              </Typography>
            </Grid>
          </Grid>

          <Grid container size={12} mt={9}>
            <Grid size={6}></Grid>
            <Grid size={6}>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  fontFamily: "calibri",
                }}
              >
                LUCKY. A. SENDUK, S.Ked.
              </Typography>
            </Grid>
          </Grid>

          {/* Tembusan */}
          <Grid size={12} mt={1} mb={1}>
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: "bold",
                fontStyle: "italic",
                fontFamily: "calibri",
              }}
            >
              Tembusan Yth :
            </Typography>
          </Grid>

          {/* List Tembusan */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "12px",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>1)
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                ml: "1px",
                fontFamily: "calibri",
              }}
            >
              Dewan Pengawas Perumda Pasar Manado
            </Typography>
          </Grid>

          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "12px",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>2)
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                ml: "1px",
                fontFamily: "calibri",
              }}
            >
              Direktur Umum
            </Typography>
          </Grid>

          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "12px",
                fontFamily: "calibri",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>3)
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                ml: "1px",
                fontFamily: "calibri",
              }}
            >
              Direktur Bisnis
            </Typography>
          </Grid>

          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "12px",
                fontFamily: "calibri",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>4)
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                ml: "1px",
                fontFamily: "calibri",
              }}
            >
              Direktur Keuangan
            </Typography>
          </Grid>

          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "12px",
                fontFamily: "calibri",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>5)
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                ml: "1px",
                fontFamily: "calibri",
              }}
            >
              Kepala Devisi Kerjasama Bisnis
            </Typography>
          </Grid>

          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "12px",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>6)
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                ml: "1px",
                fontFamily: "calibri",
              }}
            >
              Sekertaris
            </Typography>
          </Grid>

          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "12px",
                fontFamily: "calibri",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>7)
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                ml: "1px",
                fontFamily: "calibri",
              }}
            >
              Arsip
            </Typography>
          </Grid>
        </Grid>
      </Box>
      {/* Logo Pemerintah Kota Manado */}
      <Image
        src="/logo-pemerintah-kota-manado.png"
        alt="logo-pemerintah-kota-manado"
        width={150}
        height={100}
        style={{
          position: "absolute",
          top: 30,
          left: 5,
        }}
        priority
      />
      {/* Logo Perumda Pasar Manado */}
      <Image
        src="/logo-perumda-pasar-manado.png"
        alt="logo-perumda-pasar-manado"
        width={110}
        height={100}
        style={{
          position: "absolute",
          top: 30,
          left: 660,
        }}
        priority
      />
    </Box>
  );
});

export default PersetujuanSewaRuangan;
