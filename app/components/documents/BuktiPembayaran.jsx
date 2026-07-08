"use client";
import {
  Box,
  Typography,
  Divider,
  Grid,
} from "@mui/material";
import moment from "moment";
import React, { forwardRef } from "react";
import formatRupiah from "../formatrupiah/page";
import Image from "next/image";
import { getUploadApiUrl } from "@/app/utils/uploadPath";
import { buildPaymentDetail } from "@/app/utils/buildPaymentDetail";
import {
  buildReconciledPaymentBreakdown,
  hasReconciliationOtherAmount,
  roundCurrency,
} from "@/app/utils/paymentRoundingReconciliation";

const readNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const formatDecimal = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numberValue);
};

// Format ukuran ruangan disamakan dengan dokumen permohonan sewa:
// panjang x lebar dan luas memakai simbol m².
const formatRoomSize = (room = {}) => {
  const length = formatDecimal(room?.room_length);
  const width = formatDecimal(room?.room_width);
  const area = formatDecimal(room?.room_area);
  const dimension =
    length !== "-" && width !== "-" ? `${length}m x ${width}m` : "-";

  return area !== "-" ? `${dimension} (${area} m²)` : dimension;
};

// Previous payment dan payment saat ini dinormalisasi agar tabel cicilan selalu
// membaca snapshot aktual dari tabel payments, bukan menghitung ulang dari rumus lama.
const buildProofPaymentRows = (payments = {}) => {
  const currentPayment = {
    payment_number: payments?.payment_number,
    payment_date: payments?.payment_date,
    contract_amount: payments?.contract_amount,
    ppn_amount: payments?.ppn_amount,
    amount: payments?.payment_amount,
    remaining_balance: payments?.remaining_balance,
  };

  return [...(payments?.previous_payments || []), currentPayment].filter(
    (payment) => payment?.payment_number,
  );
};

// Dokumen print memakai URL upload yang sudah dinormalisasi agar data lama
// (/uploads/...) dan data baru (/api/uploads/...) tetap menghasilkan src valid.
const buildPrintableUploadImageUrl = (filePath) => getUploadApiUrl(filePath);

const BuktiPembayaran = forwardRef(({ data }, ref) => {
  if (!data) return null;
  const tenantApplication = data?.tenant_application || {};
  const room = data?.room || {};
  const paymentDetail = buildPaymentDetail({ ...tenantApplication, ...room });
  const ktpImageUrl = getUploadApiUrl(data?.tenant_application?.ktp_file_path);

  const annualRoomRent = readNumber(paymentDetail?.annualRoomRent);
  const leaseDurationYears = readNumber(paymentDetail?.leaseDurationYears, 1);
  const totalSewaKontrakRuangan = readNumber(
    paymentDetail?.totalSewaKontrakRuangan,
  );
  const totalPPNSewaKontrakRuangan = readNumber(paymentDetail?.totalPPN);
  const iuranJasaAdministrasi = readNumber(tenantApplication?.admin_fee);
  const grandTotal = readNumber(paymentDetail?.totalPayment);
  const paymentAmount = readNumber(data?.payments?.payment_amount, grandTotal);
  const paymentRows = buildProofPaymentRows(data?.payments);
  const reconciledPaymentRows = paymentRows.map((payment) => ({
    ...payment,
    reconciliation: buildReconciledPaymentBreakdown({
      paymentType: tenantApplication?.payment_type,
      paymentAmount: payment?.amount,
      contractAmount: payment?.contract_amount,
      ppnAmount: payment?.ppn_amount,
    }),
  }));
  const showOtherColumn = reconciledPaymentRows.some((payment) =>
    hasReconciliationOtherAmount(payment?.reconciliation?.otherAmount),
  );
  const roomSize = formatRoomSize(room);

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
              Harga Ruangan / Tahun
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
              {roomSize}
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
              {annualRoomRent ? formatRupiah(annualRoomRent) : "-"}
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
              Durasi Sewa
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
              {leaseDurationYears} Tahun
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
                colSpan={showOtherColumn ? 7 : 6}
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
                ...(showOtherColumn ? ["Lainnya"] : []),
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
            {reconciledPaymentRows.map((payment, idx) => (
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
                  {formatRupiah(payment.reconciliation.contractAmount)},-
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
                  {formatRupiah(payment.reconciliation.ppnAmount)},-
                </td>
                {showOtherColumn && (
                  <td
                    style={{
                      border: "1px solid black",
                      fontSize: "12px",
                      fontFamily: "calibri",
                      padding: "5px",
                      textAlign: "right",
                    }}
                  >
                    {hasReconciliationOtherAmount(
                      payment.reconciliation.otherAmount,
                    )
                      ? `${formatRupiah(payment.reconciliation.otherAmount)},-`
                      : ""}
                  </td>
                )}
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
                  {formatRupiah(payment.reconciliation.paymentAmount)},-
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
                  {formatRupiah(roundCurrency(payment.remaining_balance))},-
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
                {moment(data.payments?.payment_date).format("D MMMM YYYY") ||
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
                {formatRupiah(paymentAmount)},-
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
              src={ktpImageUrl}
              alt={`foto-ktp-${data?.tenant_application?.tenant_name}`}
              fill
              unoptimized
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

            {/* Mapping semua bukti bayar dari previous_payments dan current payment */}
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
                    - Tanggal:{" "}
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
                      src={buildPrintableUploadImageUrl(payment.proof_file_path)}
                      alt={`bukti-pembayaran-${payment.payment_number}-${data?.tenant_application?.tenant_name}`}
                      fill
                      unoptimized
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
                  src={buildPrintableUploadImageUrl(
                    data?.payments?.proof_file_path,
                  )}
                  alt={`bukti-pembayaran-pembayaran-lunas`}
                  fill
                  unoptimized
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
