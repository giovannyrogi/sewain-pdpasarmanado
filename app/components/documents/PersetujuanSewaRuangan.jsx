"use client";
import { Box, Divider, Grid, Typography } from "@mui/material";
import moment from "moment";
import React, { forwardRef } from "react";
import formatRupiah from "../formatrupiah/page";
import Image from "next/image";
import getDurationInYears from "../date_duration_in_years/getDurationInYears";

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

  const installments = [
    {
      label: data?.estimated_installment_1 ? "Cicilan 1" : "-",
      month: moment(data?.estimated_installment_1_date).format("MMM YYYY"),
      amount: formatRupiah(data?.estimated_installment_1),
    },
    {
      label: data?.estimated_installment_2 ? "Cicilan 2" : "-",
      month: moment(data?.estimated_installment_2_date).format("MMM YYYY"),
      amount: formatRupiah(data?.estimated_installment_2),
    },
    {
      label: data?.estimated_installment_3 ? "Cicilan 3" : "-",
      month: moment(data?.estimated_installment_3_date).format("MMM YYYY"),
      amount: formatRupiah(data?.estimated_installment_3),
    },
  ];

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
              fontSize: "26pt",
              fontWeight: "bold",
              fontFamily: "Bernard MT Condensed bold",
            }}
          >
            PERUSAHAAN UMUM DAERAH
          </Typography>
          <Typography
            sx={{
              fontSize: "26pt",
              fontWeight: "bold",
              fontFamily: "Bernard MT Condensed bold",
              mt: -2,
            }}
          >
            PASAR MANADO
          </Typography>
          <Typography
            sx={{
              fontSize: "7pt",
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
          <Typography
            sx={{ fontSize: "11pt", fontFamily: "Bernard MT Condensed bold" }}
          >
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
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Nomor
            </Typography>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              : {data.document_number ? data.document_number : ""}
            </Typography>
          </Grid>
          <Grid size={4.7}>
            <Typography
              sx={{ fontSize: "11pt", fontFamily: "Bernard MT Condensed bold" }}
            >
              Kepada Yth.
            </Typography>
          </Grid>
        </Grid>

        {/* Lampiran + Tenant Name */}
        <Grid container spacing={2}>
          <Grid size={7.3} display={"flex"} flexDirection={"row"} gap={3}>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Lampiran
            </Typography>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              : -
            </Typography>
          </Grid>
          <Grid size={4.7}>
            <Typography
              sx={{
                fontSize: "11pt",
                fontWeight: "bold",
                fontFamily: "Bernard MT Condensed bold",
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
            <Typography sx={{ fontSize: "11pt" }}>
              .......................................................
            </Typography>
          </Grid>
        </Grid>

        {/* Perihal + Di tempat */}
        <Grid container spacing={2}>
          <Grid size={7.3} display={"flex"} flexDirection={"row"} gap={5}>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Perihal
            </Typography>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              :{" "}
              <span
                style={{
                  fontWeight: "bold",
                  fontFamily: "Bernard MT Condensed bold",
                }}
              >
                Persetujuan Sewa Ruangan
              </span>
            </Typography>
          </Grid>
          <Grid size={4.7}>
            <Typography
              sx={{ fontSize: "11pt", fontFamily: "Bernard MT Condensed bold" }}
            >
              di - tempat
            </Typography>
          </Grid>
        </Grid>

        {/* Content */}
        <Grid container mt={1}>
          <Grid size={12}>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Dengan hormat,
            </Typography>
          </Grid>
          <Grid size={12}>
            <Typography
              sx={{
                fontSize: "11pt",
                textAlign: "justify",
                fontFamily: "Bernard MT Condensed bold",
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
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Nama Penyewa
            </Typography>
            <Typography
              sx={{
                fontSize: "11pt",
                ml: "1px",
                fontFamily: "Bernard MT Condensed bold",
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
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              No. Ruangan
            </Typography>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              :{" "}
              <span style={{ fontWeight: "bold" }}>
                {data.room_number ? `No. ${data.room_number}` : "-"}
              </span>
            </Typography>
          </Grid>

          {/* Ukuran Ruangan */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={5.1}>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Ukuran Ruangan
            </Typography>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              :{" "}
              <span
                style={{
                  fontWeight: "bold",
                  fontFamily: "Bernard MT Condensed bold",
                }}
              >
                {data.room_length && data.room_width
                  ? `${data.room_length} M X ${data.room_width} M`
                  : "-"}
              </span>
            </Typography>
          </Grid>

          {/* Ukuran Ruangan */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={6.5}>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Harga (Per m²)
            </Typography>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              :{" "}
              <span
                style={{
                  fontWeight: "bold",
                  fontFamily: "Bernard MT Condensed bold",
                }}
              >
                {data.price_per_m2 ? `${formatRupiah(parseInt(data.price_per_m2))}` : "-"}
              </span>
            </Typography>
          </Grid>

          {/* Lokasi */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={7.2}>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Lokasi / Pasar
            </Typography>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
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
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Jangka Waktu
            </Typography>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              :{" "}
              <span
                style={{
                  fontWeight: "bold",
                  fontFamily: "Bernard MT Condensed bold",
                }}
              >
                {data.start_date && data.end_date
                  ? `${getDurationInYears(
                      data.start_date,
                      data.end_date,
                    )} TAHUN (${moment(data.start_date).format(
                      "D MMMM YYYY",
                    )} S/D ${moment(data.end_date).format("D MMMM YYYY")})`
                  : ""}
              </span>
            </Typography>
          </Grid>

          {/* Detail Biaya */}
          <Grid size={12}>
            <Typography
              sx={{
                fontSize: "11pt",
                textAlign: "justify",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Pada prinsipnya pembayaran dapat kami setujui, dengan membayar{" "}
              <strong>
                {data?.payment_type === "cicilan" ? "menyicil" : "lunas"}
              </strong>{" "}
              sebagai berikut :
            </Typography>
          </Grid>

          {/* Sewa Kontrak Ruangan */}
          <Grid container size={12}>
            <Grid size={3} display={"flex"} flexDirection={"row"} gap={3.2}>
              <Typography
                sx={{
                  fontSize: "11pt",
                  textAlign: "justify",
                  fontFamily: "Bernard MT Condensed bold",
                }}
              >
                <span
                  style={{
                    marginRight: "10px",
                    fontFamily: "Bernard MT Condensed bold",
                  }}
                >
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
                  fontSize: "11pt",
                  textAlign: "justify",
                  fontWeight: "bold",
                  fontFamily: "Bernard MT Condensed bold",
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
                  fontSize: "11pt",
                  textAlign: "justify",
                  fontFamily: "Bernard MT Condensed bold",
                }}
              >
                <span
                  style={{
                    marginRight: "20px",
                    fontFamily: "Bernard MT Condensed bold",
                  }}
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
                  fontSize: "11pt",
                  textAlign: "justify",
                  fontWeight: "bold",
                  fontFamily: "Bernard MT Condensed bold",
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
                  fontSize: "11pt",
                  textAlign: "justify",
                  fontFamily: "Bernard MT Condensed bold",
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
                  fontSize: "11pt",
                  textAlign: "justify",
                  fontWeight: "bold",
                  fontFamily: "Bernard MT Condensed bold",
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
                  fontSize: "11pt",
                  textAlign: "justify",
                  fontFamily: "Bernard MT Condensed bold",
                }}
              >
                <span
                  style={{
                    marginRight: "20px",
                    fontFamily: "Bernard MT Condensed bold",
                  }}
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
                  fontSize: "11pt",
                  textAlign: "justify",
                  fontWeight: "bold",
                  fontFamily: "Bernard MT Condensed bold",
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
                  fontSize: "11pt",
                  textAlign: "justify",
                  fontFamily: "Bernard MT Condensed bold",
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
                  fontSize: "11pt",
                  textAlign: "justify",
                  fontWeight: "bold",
                  fontFamily: "Bernard MT Condensed bold",
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
                    fontSize: "11pt",
                    textAlign: "justify",
                    fontWeight: "bold",
                    fontFamily: "Bernard MT Condensed bold",
                  }}
                >
                  <span style={{ marginRight: "20px" }}></span>Menyicil{" "}
                  {data?.current_tenor === "1"
                    ? "2x"
                    : data?.current_tenor === "2"
                      ? "3x"
                      : "4x"}
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography
                  sx={{
                    fontSize: "11pt",
                    textAlign: "justify",
                    fontWeight: "bold",
                    fontFamily: "Bernard MT Condensed bold",
                  }}
                >
                  <span style={{ marginRight: "20px" }}></span>-{" "}
                  {formatRupiah(data.down_payment)}, - (Uang Muka)
                </Typography>
              </Grid>

              {installments.slice(0, data?.current_tenor).map((item, index) => (
                <Grid size={12} key={index}>
                  <Typography
                    sx={{
                      fontSize: "11pt",
                      textAlign: "justify",
                      fontWeight: "bold",
                      fontFamily: "Bernard MT Condensed bold",
                    }}
                  >
                    <span style={{ marginRight: "20px" }}></span>-{" "}
                    {item?.amount}, - ({item?.month})
                  </Typography>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Informasi pembayaran ke Bank */}
          <Grid size={12}>
            <Typography
              sx={{
                fontSize: "11pt",
                textAlign: "justify",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              <span style={{ marginRight: "10px" }}>2.</span>
              Pembayaran sewa kontrak ruangan dapat dilakukan malalui transfer
              ke rekening :
            </Typography>
          </Grid>

          {/* Nama Bank */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={9.3}>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              <span style={{ marginRight: "20px" }}></span> Nama Bank
            </Typography>
            <Typography
              sx={{
                fontSize: "11pt",
                ml: "1px",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              : <span style={{ fontWeight: "bold" }}>Bank SulutGo</span>
            </Typography>
          </Grid>

          {/* Nomor Rekening */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={5.3}>
            <Typography
              sx={{
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>Nomor Rekening
            </Typography>
            <Typography
              sx={{
                fontSize: "11pt",
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
                fontSize: "11pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>Atas Nama
            </Typography>
            <Typography
              sx={{
                fontSize: "11pt",
                ml: "1px",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              :{" "}
              <span style={{ fontWeight: "bold" }}>PD. Pasar Kota Manado</span>
            </Typography>
          </Grid>

          <Grid size={12} mt={1}>
            <Typography
              sx={{
                fontSize: "11pt",
                textAlign: "justify",
                fontFamily: "Bernard MT Condensed bold",
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
                fontSize: "11pt",
                textAlign: "justify",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Setelah pembayaran dilakukan, copy bukti transfer dapat segera
              diserahkan ke bagian sewa kontrak untuk diproses penandatanganan
              kontrak ruangan.
            </Typography>
            <Typography
              sx={{
                fontSize: "11pt",
                textAlign: "justify",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Demikian kami sampaikan, atas perhatian dan kerjasamanya kami
              ucapkan terima kasih.
            </Typography>
          </Grid>

          {/* TTD Direktur */}
          <Grid container size={12} mt={1}>
            <Grid size={6.8}></Grid>
            <Grid size={5.2}>
              <Typography
                sx={{
                  fontSize: "11pt",
                  fontWeight: "bold",
                  fontFamily: "Bernard MT Condensed bold",
                }}
              >
                Direktur Utama
              </Typography>
            </Grid>
          </Grid>

          <Grid container size={12} mt={7}>
            <Grid size={6.1}></Grid>
            <Grid size={5.9}>
              <Typography
                sx={{
                  fontSize: "11pt",
                  fontWeight: "bold",
                  fontFamily: "Bernard MT Condensed bold",
                }}
              >
                LUCKY. A. SENDUK, S.Ked.
              </Typography>
            </Grid>
          </Grid>

          {/* Tembusan */}
          <Grid size={12} mt={1}>
            <Typography
              sx={{
                fontSize: "7pt",
                fontWeight: "bold",
                fontStyle: "italic",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Tembusan Yth :
            </Typography>
          </Grid>

          {/* List Tembusan */}
          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "7pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>1)
            </Typography>
            <Typography
              sx={{
                fontSize: "7pt",
                ml: "1px",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Dewan Pengawas Perumda Pasar Manado
            </Typography>
          </Grid>

          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "7pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>2)
            </Typography>
            <Typography
              sx={{
                fontSize: "7pt",
                ml: "1px",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Direktur Umum
            </Typography>
          </Grid>

          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "7pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>3)
            </Typography>
            <Typography
              sx={{
                fontSize: "7pt",
                ml: "1px",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Direktur Bisnis
            </Typography>
          </Grid>

          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "7pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>4)
            </Typography>
            <Typography
              sx={{
                fontSize: "7pt",
                ml: "1px",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Direktur Keuangan
            </Typography>
          </Grid>

          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "7pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>5)
            </Typography>
            <Typography
              sx={{
                fontSize: "7pt",
                ml: "1px",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Kepala Devisi Kerjasama Bisnis
            </Typography>
          </Grid>

          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "7pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>6)
            </Typography>
            <Typography
              sx={{
                fontSize: "7pt",
                ml: "1px",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              Sekertaris
            </Typography>
          </Grid>

          <Grid size={12} display={"flex"} flexDirection={"row"} gap={1}>
            <Typography
              sx={{
                fontSize: "7pt",
                fontFamily: "Bernard MT Condensed bold",
              }}
            >
              <span style={{ marginRight: "20px" }}></span>7)
            </Typography>
            <Typography
              sx={{
                fontSize: "7pt",
                ml: "1px",
                fontFamily: "Bernard MT Condensed bold",
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
          // top: 30,
          top: 2270,
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
          // top: 30,
          top: 2270,
          left: 660,
        }}
        priority
      />
    </Box>
  );
});

export default PersetujuanSewaRuangan;
