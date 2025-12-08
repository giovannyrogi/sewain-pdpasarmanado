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
import Image from "next/image";

const BuktiPembayaran = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const handleCalculateTotal = () => {
    // console.log("data", data);

    // Konversi nilai ke number
    const paymentAmount = Number(data?.payments?.payment_amount || 0);
    const roomPrice = Number(data?.room?.price_per_m2 || 0);
    const roomArea = Number(data?.room?.room_area || 0);

    const downPayment = Number(data?.tenant_application?.down_payment || 0);
    const iuranJasaAdministrasi = Number(
      data?.tenant_application?.admin_fee || 0
    );

    // hitung nilai kontrak dan PPN dari DP
    const nilaiKontrakDP = downPayment / 1.11;
    const PPNDownPayment = nilaiKontrakDP * 0.11;

    const totalSewaKontrakRuangan = roomPrice * roomArea;

    const totalPPNSewaKontrakRuangan = totalSewaKontrakRuangan * 0.11;
    const grandTotal =
      totalSewaKontrakRuangan +
      totalPPNSewaKontrakRuangan +
      iuranJasaAdministrasi;

    const nilaiKontrak = Number(data?.payments?.contract_amount || 0);

    const totalPPN = Number(data?.payments?.ppn_amount || 0);

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

    if (data?.payments?.previous_payments?.length > 0) {
      previousAmountDP = Number(
        data?.payments?.previous_payments[0]?.amount || 0
      );
      previousContractAmountDP = Number(
        data?.payments?.previous_payments[0]?.contract_amount || 0
      );
      previousPPNDP = Number(
        data?.payments?.previous_payments[0]?.ppn_amount || 0
      );
      previousProofFilePathDP =
        data?.payments?.previous_payments[0]?.proof_file_path;
      previousPaymentDateDP =
        data?.payments?.previous_payments[0]?.payment_date;
      previousPaymentNumberDP =
        data?.payments?.previous_payments[0]?.payment_number;
      previousRemainingBalanceDP = Number(
        data?.payments?.previous_payments[0]?.remaining_balance || 0
      );

      previousAmount1 = Number(
        data?.payments?.previous_payments[1]?.amount || 0
      );
      previousContractAmount1 = Number(
        data?.payments?.previous_payments[1]?.contract_amount || 0
      );
      previousPPN1 = Number(
        data?.payments?.previous_payments[1]?.ppn_amount || 0
      );
      previousProofFilePath1 =
        data?.payments?.previous_payments[1]?.proof_file_path;
      previousPaymentDate1 = data?.payments?.previous_payments[1]?.payment_date;
      previousPaymentNumber1 =
        data?.payments?.previous_payments[1]?.payment_number;
      previousRemainingBalance1 = Number(
        data?.payments?.previous_payments[1]?.remaining_balance || 0
      );

      previousAmount2 = Number(
        data?.payments?.previous_payments[2]?.amount || 0
      );
      previousContractAmount2 = Number(
        data?.payments?.previous_payments[2]?.contract_amount || 0
      );
      previousPPN2 = Number(
        data?.payments?.previous_payments[2]?.ppn_amount || 0
      );
      previousProofFilePath2 =
        data?.payments?.previous_payments[2]?.proof_file_path;
      previousPaymentDate2 = data?.payments?.previous_payments[2]?.payment_date;
      previousPaymentNumber2 =
        data?.payments?.previous_payments[2]?.payment_number;
      previousRemainingBalance2 = Number(
        data?.payments?.previous_payments[2]?.remaining_balance || 0
      );

      previousAmount3 = Number(
        data?.payments?.previous_payments[3]?.amount || 0
      );
      previousContractAmount3 = Number(
        data?.payments?.previous_payments[3]?.contract_amount || 0
      );
      previousPPN3 = Number(
        data?.payments?.previous_payments[3]?.ppn_amount || 0
      );
      previousProofFilePath3 =
        data?.payments?.previous_payments[3]?.proof_file_path;
      previousPaymentDate3 = data?.payments?.previous_payments[3]?.payment_date;
      previousPaymentNumber3 =
        data?.payments?.previous_payments[3]?.payment_number;
      previousRemainingBalance3 = Number(
        data?.payments?.previous_payments[3]?.remaining_balance || 0
      );
    }

    return {
      totalSewaKontrakRuangan,
      totalPPNSewaKontrakRuangan,
      paymentAmount,
      nilaiKontrak,
      totalPPN,
      grandTotal,
      iuranJasaAdministrasi,
      PPNDownPayment,
      nilaiKontrakDP,
      downPayment,

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
    paymentAmount,
    nilaiKontrak,
    totalPPN,
    totalSewaKontrakRuangan,
    totalPPNSewaKontrakRuangan,
    grandTotal,
    iuranJasaAdministrasi,
    PPNDownPayment,
    nilaiKontrakDP,
    downPayment,

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
    totalSewaKontrakRuangan: 0,
    paymentAmount: 0,
    nilaiKontrak: 0,
    totalPPN: 0,
    totalPPNSewaKontrakRuangan: 0,
    grandTotal: 0,
    iuranJasaAdministrasi: 0,
    PPNDownPayment: 0,
    nilaiKontrakDP: 0,
    downPayment: 0,

    previousAmountDP: 0,
    previousContractAmountDP: 0,
    previousPPNDP: 0,
    previousProofFilePathDP: "",
    previousPaymentDateDP: "",
    previousPaymentNumberDP: "",
    previousRemainingBalanceDP: 0,

    previousAmount1: 0,
    previousContractAmount1: 0,
    previousPPN1: 0,
    previousProofFilePath1: "",
    previousPaymentDate1: "",
    previousPaymentNumber1: "",
    previousRemainingBalance1: 0,

    previousAmount2: 0,
    previousContractAmount2: 0,
    previousPPN2: 0,
    previousProofFilePath2: "",
    previousPaymentDate2: "",
    previousPaymentNumber2: "",
    previousRemainingBalance2: 0,

    previousAmount3: 0,
    previousContractAmount3: 0,
    previousPPN3: 0,
    previousProofFilePath3: "",
    previousPaymentDate3: "",
    previousPaymentNumber3: "",
    previousRemainingBalance3: 0,
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
      {/* Tabel Rincian Tagihan */}
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
                textAlign: "center",
                fontSize: "14px",
                fontFamily: "calibri",
              }}
            >
              Rincian Tagihan
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
              Total Sewa Ruangan
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
              No. {data?.room?.room_number ?? "-"}
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
                border: "1px solid black",
                fontFamily: "calibri",
                padding: "5px",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              Iuran Jasa Administrasi
            </td>
            <td
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                padding: "5px",
                fontSize: "13px",
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              {formatRupiah(iuranJasaAdministrasi)},-
            </td>
          </tr>

          <tr>
            <td
              colSpan={5}
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                padding: "5px",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              PPN (11%)
            </td>
            <td
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                padding: "5px",
                fontSize: "13px",
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              {formatRupiah(totalPPNSewaKontrakRuangan)},-
            </td>
          </tr>

          <tr>
            <td
              colSpan={5}
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                padding: "5px",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              Total Tagihan
            </td>
            <td
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                padding: "5px",
                fontSize: "13px",
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              {formatRupiah(grandTotal)},-
            </td>
          </tr>
        </tbody>
      </table>
      {/* Pembayaran Cicilan */}
      {data?.tenant_application?.payment_type === "cicilan" ? (
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            fontSize: "12px",
            marginTop: "40px",
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
                  textAlign: "center",
                  fontSize: "14px",
                  fontFamily: "calibri",
                }}
              >
                Rincian Pembayaran (Cicilan)
              </th>
            </tr>
            <tr>
              {[
                "Tahap Pembayaran",
                "Tanggal Pembayaran",
                "Nilai Kontrak",
                "PPN (11%)",
                "Total Pembayaran",
                "Sisa Tagihan",
              ].map((header, i) => (
                <th
                  key={i}
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: "13px",
                    fontFamily: "calibri",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Gabungkan previous_payments + current payment */}
            {[
              ...(data?.payments?.previous_payments || []),
              {
                payment_number: data?.payments?.payment_number,
                payment_date: data?.payments?.payment_date,
                contract_amount: data?.payments?.contract_amount,
                ppn_amount: data?.payments?.ppn_amount,
                amount: data?.payments?.payment_amount,
                remaining_balance: data?.payments?.remaining_balance,
              },
            ].map((payment, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    border: "1px solid black",
                    fontSize: "12px",
                    fontFamily: "calibri",
                    padding: "5px",
                    textAlign: "center",
                  }}
                >
                  {payment.payment_number === 1
                    ? "Uang Muka (DP)"
                    : `Cicilan ${payment.payment_number - 1}`}
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    fontSize: "12px",
                    fontFamily: "calibri",
                    padding: "5px",
                    textAlign: "center",
                  }}
                >
                  {moment(payment.payment_date).format("D MMMM YYYY")}
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    fontSize: "12px",
                    fontFamily: "calibri",
                    padding: "5px",
                    textAlign: "right",
                  }}
                >
                  {formatRupiah(payment.contract_amount)},-
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    fontSize: "12px",
                    fontFamily: "calibri",
                    padding: "5px",
                    textAlign: "right",
                  }}
                >
                  {formatRupiah(payment.ppn_amount)},-
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    fontSize: "12px",
                    fontFamily: "calibri",
                    padding: "5px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {formatRupiah(payment.amount)},-
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    fontSize: "12px",
                    fontFamily: "calibri",
                    padding: "5px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {formatRupiah(payment.remaining_balance)},-
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table
          style={{
            borderCollapse: "collapse",
            width: "50%",
            fontSize: "12px",
            marginTop: "30px",
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
                  textAlign: "center",
                  fontSize: "14px",
                  fontFamily: "calibri",
                }}
              >
                Rincian Pembayaran (Lunas)
              </th>
            </tr>
            <tr>
              <th
                style={{
                  border: "1px solid black",
                  padding: "5px",
                  fontWeight: "bold",
                  textAlign: "center",
                  fontSize: "14px",
                  fontFamily: "calibri",
                }}
              >
                Tanggal Pembayaran
              </th>
              <th
                style={{
                  border: "1px solid black",
                  padding: "5px",
                  fontWeight: "bold",
                  textAlign: "center",
                  fontSize: "14px",
                  fontFamily: "calibri",
                }}
              >
                Total Pembayaran
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
                  textAlign: "center",
                }}
              >
                {moment(data.payments?.payment_date).format("Do MMMM YYYY") ||
                  "-"}
              </td>
              <td
                style={{
                  border: "1px solid black",
                  fontFamily: "calibri",
                  padding: "5px",
                  fontSize: "13px",
                  textAlign: "right",
                  fontWeight: "bold",
                }}
              >
                {formatRupiah(grandTotal)},-
              </td>
            </tr>
          </tbody>
        </table>
      )}
      {/* Bagian KTP & Bukti Pembayaran */}
      <Grid container mt={3} spacing={1}>
        {/* Foto KTP - hanya tampil sekali */}
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
          <Box
            sx={{
              width: "100%",
              maxWidth: 450,
              aspectRatio: "16/9",
              position: "relative",
            }}
          >
            <Image
              src={data?.tenant_application?.ktp_file_path}
              alt={`foto-ktp-${data?.tenant_application?.tenant_name}`}
              fill
              style={{ objectFit: "contain", borderRadius: "8px" }}
              priority
            />
          </Box>
        </Grid>

        {data?.tenant_application?.payment_type === "cicilan" ? (
          <Grid size={12} container>
            <Grid
              size={12}
              sx={{
                "@media print": {
                  pageBreakBefore: "always",
                  breakBefore: "page",
                  marginTop: "10mm",
                },
              }}
            >
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

            {/* Mapping semua bukti bayar dari previous_payments  current payment */}
            {[...(data?.payments?.previous_payments || []), data?.payments]
              .filter((p) => p && p.proof_file_path) // hanya tampil jika ada file
              .map((payment, index) => (
                <Grid
                  key={index}
                  size={12}
                  mb={3}
                  align="center"
                  sx={{
                    "@media print": {
                      pageBreakBefore:
                        payment.payment_number === 3 ? "always" : "unset",
                      breakBefore:
                        payment.payment_number === 3 ? "page" : "unset",
                      marginTop:
                        payment.payment_number === 3 ? "15mm" : "unset",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      fontFamily: "calibri",
                    }}
                  >
                    {payment.payment_number === 1
                      ? "Uang Muka (DP)"
                      : `Cicilan ${payment.payment_number - 1}`}{" "}
                    — Tanggal:{" "}
                    {moment(payment.payment_date).format("D MMMM YYYY")}
                  </Typography>
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: 700,
                      aspectRatio: "21/9",
                      position: "relative",
                      mx: "auto",
                    }}
                  >
                    <Image
                      src={payment.proof_file_path}
                      alt={`bukti-pembayaran-${payment.payment_number}-${data?.tenant_application?.tenant_name}`}
                      fill
                      style={{
                        objectFit: "contain",
                        borderRadius: "8px",
                      }}
                      priority
                    />
                  </Box>
                </Grid>
              ))}
          </Grid>
        ) : (
          <Grid size={12} container>
            <Grid
              size={12}
              sx={{
                "@media print": {
                  pageBreakBefore: "always",
                  breakBefore: "page",
                  marginTop: "10mm",
                },
              }}
            >
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

            <Grid
              size={12}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 4,
              }}
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  fontFamily: "calibri",
                  fontWeight: "bold",
                }}
              >
                Pembayaran Lunas -{" "}
                {moment(data?.payments?.payment_date).format("D MMMM YYYY")}
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 700,
                  aspectRatio: "21/9",
                  position: "relative",
                  mx: "auto",
                }}
              >
                <Image
                  src={data?.payments?.proof_file_path}
                  alt={`bukti-pembayaran-pembayaran-lunas`}
                  fill
                  style={{
                    objectFit: "contain",
                  }}
                  priority
                />
              </Box>
            </Grid>
          </Grid>
        )}
      </Grid>
      <Grid container mt={4} spacing={2}>
        <Grid size={12} textAlign={"right"}>
          <Typography
            sx={{
              "@media print": {
                position: "fixed",
                bottom: 0,
                right: 0,
                fontSize: "11px",
                fontFamily: "calibri",
                color: "gray",
                fontWeight: "bold",
                paddingRight: "10mm",
                paddingBottom: "5mm",
              },
            }}
          >
            Dicetak Tanggal : {""}
            {`${moment(new Date()).format("YYYY/MM/DD HH:mm:ss")}`}
          </Typography>
        </Grid>
      </Grid>

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

export default BuktiPembayaran;
