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

const SuratKontrakPemakaian = forwardRef(({ data }, ref) => {
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

export default SuratKontrakPemakaian;
