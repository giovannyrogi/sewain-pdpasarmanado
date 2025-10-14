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

      {/* Tabel Rincian Pembayaran */}
      {data?.tenant_application?.payment_type === "cicilan" ? (
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
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
                Rincian Pembayaran (Cicilan)
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
                Tahap Pembayaran
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
                Nilai Kontrak
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
                PPN (11%)
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
                Sisa Tagihan
              </th>
            </tr>
          </thead>

          {/* Pembayaran Pertama / Uang Muka */}
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
                Uang Muka (DP)
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
                {moment(data.tenant_application?.created_at).format("Do MMMM YYYY") ||
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
                {formatRupiah(nilaiKontrakDP)},-
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
                {formatRupiah(PPNDownPayment)},-
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
                {formatRupiah(downPayment)},-
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
                {formatRupiah(
                  Number(data?.tenant_application?.remaining_payment)
                )}
                ,-
              </td>
            </tr>
          </tbody>

          {/* Pembayaran Cicilan */}
          {data.payments?.payment_number === 1 ? (
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
                  Cicilan (1)
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
                  {formatRupiah(nilaiKontrak)},-
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
                  {formatRupiah(totalPPN)},-
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
                  {formatRupiah(data?.payments?.payment_amount)},-
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
                  {formatRupiah(Number(data?.payments?.remaining_balance))},-
                </td>
              </tr>
            </tbody>
          ) : data.payments?.payment_number === 2 ? (
            "Cicilan 2"
          ) : (
            "Cicilan 3"
          )}
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
