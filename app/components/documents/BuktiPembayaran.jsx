"use client";
import {
  Box,
  Typography,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Grid,
} from "@mui/material";
import moment from "moment";
import React, { forwardRef } from "react";
import formatRupiah from "../formatrupiah/page";

const BuktiPembayaran = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const handleCalculateTotal = () => {
    // Konversi nilai ke number
    const paymentAmount = Number(data?.payments?.payment_amount || 0);
    const roomPrice = Number(data?.room?.price_per_m2 || 0);
    const roomArea = Number(data?.room?.room_area || 0);

    const totalSewaKontrakRuangan = roomPrice * roomArea;

    const nilaiKontrak = paymentAmount / 1.11;

    const totalPPN = nilaiKontrak * 0.11;

    const grandTotal = nilaiKontrak + totalPPN;

    return {
      totalSewaKontrakRuangan,
      paymentAmount,
      nilaiKontrak,
      totalPPN,
      grandTotal,
    };
  };

  const {
    paymentAmount,
    nilaiKontrak,
    totalPPN,
    grandTotal,
    totalSewaKontrakRuangan,
  } = handleCalculateTotal() || {
    totalSewaKontrakRuangan: 0,
    paymentAmount: 0,
    nilaiKontrak: 0,
    totalPPN: 0,
    grandTotal: 0,
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
          mb: 5,
        }}
      />

      <Grid container spacing={2} mb={0.3}>
        <Grid
          size={12}
          display={"flex"}
          flexDirection={"row"}
          justifyContent={"end"}
        >
          <Typography
            sx={{ fontSize: "13px", fontFamily: "calibri", fontWeight: "bold" }}
          >
            Masa berlaku{" "}
            {moment(data?.tenant_application?.start_date).format("D MMMM YYYY")}{" "}
            S/D{" "}
            {moment(data?.tenant_application?.end_date).format("D MMMM YYYY")}
          </Typography>
        </Grid>
      </Grid>

      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr>
            <th
              colSpan={6}
              style={{
                border: "1px solid black",
                padding: "5px",
                fontWeight: "bold",
                // textAlign: "center",
                fontSize: "14px",
                fontFamily: "calibri",
              }}
            >
              Rincian Pembayaran Tagihan
            </th>
          </tr>
          <tr>
            <th
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                fontSize: "13px",
                padding: "5px",
              }}
            >
              Nama Penyewa
            </th>
            <th
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                padding: "5px",
                fontSize: "13px",
              }}
            >
              Lokasi
            </th>
            <th
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                padding: "5px",
                fontSize: "13px",
              }}
            >
              Nomor Ruangan
            </th>
            <th
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                padding: "5px",
                fontSize: "13px",
              }}
            >
              Ukuran Ruangan
            </th>
            <th
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                padding: "5px",
                fontSize: "13px",
              }}
            >
              Harga Ruangan
            </th>
            <th
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                padding: "5px",
                textAlign: "right",
                fontSize: "13px",
              }}
            >
              Jumlah Pembayaran
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              style={{
                fontSize: "12px",
                fontFamily: "calibri",
                whiteSpace: "pre-line",
                wordBreak: "break-all",
                border: "solid 1px black",
                padding: "5px",
                width: "150px",
              }}
            >
              {data.tenant_application?.tenant_name || "-"}
            </td>
            <td
              style={{
                fontSize: "12px",
                fontFamily: "calibri",
                whiteSpace: "pre-line",
                wordBreak: "break-all",
                border: "solid 1px black",
                padding: "5px",
                width: "150px",
              }}
            >
              {data?.location?.location_name ?? "-"}
            </td>
            <td
              style={{
                fontSize: "12px",
                fontFamily: "calibri",
                whiteSpace: "pre-line",
                wordBreak: "break-all",
                border: "solid 1px black",
                padding: "5px",
                textAlign: "center",
                width: "100px",
              }}
            >
              {data?.room?.room_number ?? "-"}
            </td>
            <td
              style={{
                fontSize: "12px",
                fontFamily: "calibri",
                whiteSpace: "pre-line",
                wordBreak: "break-all",
                border: "solid 1px black",
                padding: "5px",
                textAlign: "center",
              }}
            >
              {data?.room?.room_width ? data?.room?.room_width + "M" : "-"} X{" "}
              {data?.room?.room_length ? data?.room?.room_length + "M" : "-"}
            </td>
            <td
              style={{
                fontSize: "12px",
                fontFamily: "calibri",
                whiteSpace: "pre-line",
                wordBreak: "break-all",
                border: "solid 1px black",
                padding: "5px",
                textAlign: "right",
              }}
            >
              {data?.room?.price_per_m2
                ? formatRupiah(data?.room?.price_per_m2) + "/M2"
                : "-"}
            </td>
            <td
              style={{
                fontSize: "12px",
                fontFamily: "calibri",
                whiteSpace: "pre-line",
                wordBreak: "break-all",
                border: "solid 1px black",
                padding: "5px",
                textAlign: "right",
                fontWeight: "bold",
                width: "120px",
              }}
            >
              {formatRupiah(totalSewaKontrakRuangan)},-
            </td>
          </tr>

          <tr>
            <td
              colSpan={5}
              style={{
                fontSize: "12px",
                fontFamily: "calibri",
                fontWeight: "bold",
                whiteSpace: "pre-line",
                wordBreak: "break-all",
                border: "solid 1px black",
                padding: "5px",
              }}
            >
              Nilai Kontrak
            </td>
            <td
              colSpan={1}
              style={{
                fontSize: "12px",
                fontFamily: "calibri",
                whiteSpace: "pre-line",
                wordBreak: "break-all",
                border: "solid 1px black",
                padding: "5px",
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              {formatRupiah(nilaiKontrak)},-
            </td>
          </tr>

          <tr>
            <td
              colSpan={5}
              style={{
                fontSize: "12px",
                fontFamily: "calibri",
                fontWeight: "bold",
                whiteSpace: "pre-line",
                wordBreak: "break-all",
                border: "solid 1px black",
                padding: "5px",
              }}
            >
              PPN 11%
            </td>
            <td
              colSpan={1}
              style={{
                fontSize: "12px",
                fontFamily: "calibri",
                whiteSpace: "pre-line",
                wordBreak: "break-all",
                border: "solid 1px black",
                padding: "5px",
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              {formatRupiah(totalPPN)},-
            </td>
          </tr>

          <tr>
            <td
              colSpan={5}
              style={{
                fontSize: "12px",
                fontFamily: "calibri",
                fontWeight: "bold",
                whiteSpace: "pre-line",
                wordBreak: "break-all",
                border: "solid 1px black",
                padding: "5px",
              }}
            >
              Total Pembayaran
            </td>
            <td
              colSpan={1}
              style={{
                fontSize: "12px",
                fontFamily: "calibri",
                whiteSpace: "pre-line",
                wordBreak: "break-all",
                border: "solid 1px black",
                padding: "5px",
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              {formatRupiah(grandTotal)},-
            </td>
          </tr>
        </tbody>
      </table>

      <Grid container mt={3} spacing={2}>
        <Grid size={12}>
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: "bold",
              fontFamily: "calibri",
              borderBottom: "1px solid black",
            }}
          >
            Foto Bukti Pembayaran
          </Typography>
        </Grid>
        <Grid size={12}>
          <img
            src={data?.payments?.proof_file_path}
            alt={`bukti-pembayaran-${data?.tenant_application?.tenant_name}`}
            width="700px"
            height="300px"
          />
        </Grid>

        <Grid size={12} mt={3}>
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: "bold",
              fontFamily: "calibri",
              borderBottom: "1px solid black",
            }}
          >
            Foto Kartu Tanda Penduduk (KTP)
          </Typography>
        </Grid>

        <Grid size={12}>
          <img
            src={data?.tenant_application?.ktp_file_path}
            alt={`foto-ktp-${data?.tenant_application?.tenant_name}`}
            width="450px"
            height="250px"
          />
        </Grid>
      </Grid>

      <Grid container mt={4} spacing={2}>
        <Grid size={12} textAlign={"right"}>
          <Typography
            sx={{
              fontSize: "11px",
              fontFamily: "calibri",
              color: "gray",
              fontWeight: "bold",
            }}
          >
            Dicetak Tanggal : {""}
            {`${moment(new Date()).format("YYYY/MM/DD HH:mm:ss")}`}
          </Typography>
        </Grid>
      </Grid>

      {/* Logo Pemerintah Kota Manado */}
      <img
        src="/logo-pemerintah-kota-manado.png"
        alt="logo-pemerintah-kota-manado"
        style={{
          width: "150px",
          height: "100px",
          position: "absolute",
          top: 30,
          left: 5,
        }}
      />
      {/* Logo Perumda Pasar Manado */}
      <img
        src="/logo-perumda-pasar-manado.png"
        alt="logo-perumda-pasar-manado"
        style={{
          width: "110px",
          height: "100px",
          position: "absolute",
          top: 30,
          left: 660,
        }}
      />
    </Box>
  );
});

export default BuktiPembayaran;
