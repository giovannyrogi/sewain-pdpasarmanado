"use client";
import { Box, Divider, Grid, Typography } from "@mui/material";
import moment from "moment";
import React, { forwardRef } from "react";
import formatRupiah from "../formatrupiah/page";
import Image from "next/image";
import { formatNumber } from "@/app/utils/formatNumber";

const SuratPernyataanPenyewa = forwardRef(({ data }, ref) => {
  if (!data) return null;
  // console.log("data", data);

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

    // console.log('total payment', totalPayment);
    // console.log('down payment', downPayment);
    // console.log('installment 1', installment1);
    // console.log('installment 2', installment2);
    // console.log('installment 3', installment3);
    // console.log('remaining payment', remainingPayment);
    // console.log('room price', roomPrice);
    // console.log('room area', roomArea);
    

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
      month: data?.estimated_installment_1_date
        ? moment(data?.estimated_installment_1_date).format("MMMM YYYY")
        : "-",
      amount: formatRupiah(data?.estimated_installment_1),
    },
    {
      label: data?.estimated_installment_2 ? "Cicilan 2" : "-",
      month: data?.estimated_installment_2_date
        ? moment(data?.estimated_installment_2_date).format("MMMM YYYY")
        : "-",
      amount: formatRupiah(data?.estimated_installment_2),
    },
    {
      label: data?.estimated_installment_3 ? "Cicilan 3" : "-",
      month: data?.estimated_installment_3_date
        ? moment(data?.estimated_installment_3_date).format("MMMM YYYY")
        : "-",
      amount: formatRupiah(data?.estimated_installment_2),
    },
  ];

  // console.log("data", data);

  return (
    <Box ref={ref} sx={{ padding: "30px 50px 0px 30px" }}>
      <Grid container spacing={1}>
        {/* Tanggal */}
        <Grid size={12} align={"end"}>
          <Typography
            sx={{
              fontFamily: "calibri",
              fontSize: "11pt",
            }}
          >
            Manado,{moment(new Date()).format("D MMMM YYYY")}
          </Typography>
        </Grid>

        <Grid size={12} mt={2}>
          <Typography
            sx={{
              fontFamily: "calibri",
              fontSize: "11pt",
            }}
          >
            Kepada Yth,
          </Typography>
        </Grid>

        <Grid size={12}>
          <Typography
            sx={{
              fontFamily: "calibri",
              fontSize: "11pt",
              fontWeight: "bold",
            }}
          >
            Pimpinan
          </Typography>
        </Grid>

        <Grid size={12}>
          <Typography
            sx={{
              fontFamily: "calibri",
              fontSize: "11pt",
              fontWeight: "bold",
            }}
          >
            PD. Pasar Kota Manado
          </Typography>
        </Grid>

        <Grid size={12}>
          <Typography
            sx={{
              fontFamily: "calibri",
              fontSize: "11pt",
            }}
          >
            di-tempat
          </Typography>
        </Grid>

        <Grid size={12} mt={1}>
          <Typography
            sx={{
              fontFamily: "calibri",
              fontSize: "11pt",
            }}
          >
            Dengan hormat,
          </Typography>
        </Grid>

        <Grid size={12}>
          <Typography
            sx={{
              fontFamily: "calibri",
              fontSize: "11pt",
              textAlign: "justify",
            }}
          >
            Dengan ini kami mengajukan Permohonan{" "}
            {data?.application_type === "permohonan_baru"
              ? "Baru"
              : "Perpanjangan"}{" "}
            Kontrak Ruangan sebagai berikut :
          </Typography>
        </Grid>

        {/* Data Penyewa */}
        <Grid size={12}>
          {[
            { label: "Nama", value: data?.tenant_name },
            { label: "NIK", value: data?.tenant_nik },
            {
              label: "No. HP",
              value: data?.tenant_phone,
              // capitalize: true,
            },
            {
              label: "No. Ruangan",
              value: `${data?.floor} No. ${data?.room_number}`,
            },
            { label: "Lokasi / Pasar", value: data?.location_name },
            {
              label: "Jangka Waktu",
              value:
                data?.start_date && data?.end_date
                  ? `${moment(data?.start_date).format(
                      "DD/MM/YYYY",
                    )} s/d ${moment(data?.end_date).format("DD/MM/YYYY")}`
                  : undefined,
            },
          ].map((item, index, arr) => (
            <Grid container size={12} key={index}>
              {/* Label */}
              <Grid size={2}>
                <Typography
                  sx={{
                    fontSize: "11pt",
                    // fontWeight: "bold",
                    // color: theme.palette.text.disabled,
                    fontFamily: "calibri",
                  }}
                >
                  {item.label}
                </Typography>
              </Grid>

              {/* Value */}
              <Grid size={10}>
                <Typography
                  sx={{
                    fontSize: "11pt",
                    fontWeight: "bold",
                    // color: theme.palette.text.disabled,
                    fontFamily: "calibri",
                    textTransform: item.capitalize ? "capitalize" : "none",
                  }}
                >
                  : {item.value || ""}
                </Typography>
              </Grid>
            </Grid>
          ))}
        </Grid>

        <Grid size={12} mt={1}>
          <Typography
            sx={{
              fontFamily: "calibri",
              textAlign: "justify",
              fontSize: "11pt",
            }}
          >
            Adapun pembayaran kontrak dibayar{" "}
            {data?.payment_type === "cicilan" ? "Menyicil" : "Lunas"} dengan
            rincian sebagai berikut :
          </Typography>
        </Grid>

        <Grid size={12}>
          {/* Tabel Rincian Tagihan */}
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              fontSize: "11pt",
            }}
          >
            <thead>
              <tr>
                <th
                  colSpan={4}
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: "12pt",
                    fontFamily: "calibri",
                  }}
                >
                  Rincian Pembayaran
                </th>
              </tr>
              <tr>
                <th
                  style={{
                    border: "1px solid black",
                    fontFamily: "calibri",
                    padding: "5px",
                    fontSize: "11pt",
                    width: "100pt",
                  }}
                >
                  Jenis Pembayaran
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    fontFamily: "calibri",
                    padding: "5px",
                    fontSize: "11pt",
                    width: "130pt",
                  }}
                >
                  Ukuran Ruangan
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    fontFamily: "calibri",
                    padding: "5px",
                    fontSize: "11pt",
                    width: "80pt",
                  }}
                >
                  Harga Ruangan
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    fontFamily: "calibri",
                    padding: "5px",
                    textAlign: "center",
                    fontSize: "11pt",
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
                    fontSize: "11pt",
                    fontFamily: "calibri",
                    whiteSpace: "pre-line",
                    wordBreak: "break-all",
                    border: "solid 1px black",
                    padding: "5px",
                    textAlign: "center",
                  }}
                >
                  {data?.payment_type === "cicilan" ? "Cicilan" : "Lunas"}
                </td>
                <td
                  style={{
                    fontSize: "11pt",
                    fontFamily: "calibri",
                    whiteSpace: "pre-line",
                    wordBreak: "break-all",
                    border: "solid 1px black",
                    padding: "5px",
                    textAlign: "center",
                  }}
                >
                  {data?.room_width ? formatNumber(data?.room_width) + "m" : "-"} X{" "}
                  {data?.room_length ? formatNumber(data?.room_length) + "m" : "-"} (
                  {data?.room_area ? formatNumber(data?.room_area) + " m²" : "-"})
                </td>
                <td
                  style={{
                    fontSize: "11pt",
                    fontFamily: "calibri",
                    whiteSpace: "pre-line",
                    wordBreak: "break-all",
                    border: "solid 1px black",
                    padding: "5px",
                    textAlign: "right",
                  }}
                >
                  {data?.price_per_m2
                    ? formatRupiah(data?.price_per_m2) + "/m²"
                    : "-"}
                </td>
                <td
                  style={{
                    fontSize: "11pt",
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
                  {formatRupiah(data?.total_payment_room)},-
                </td>
              </tr>

              <tr>
                <td
                  colSpan={3}
                  style={{
                    border: "1px solid black",
                    fontFamily: "calibri",
                    padding: "5px",
                    fontSize: "11pt",
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
                    fontSize: "11pt",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {formatRupiah(data?.admin_fee)},-
                </td>
              </tr>

              <tr>
                <td
                  colSpan={3}
                  style={{
                    border: "1px solid black",
                    fontFamily: "calibri",
                    padding: "5px",
                    fontSize: "11pt",
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
                    fontSize: "11pt",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {formatRupiah(data?.total_ppn)},-
                </td>
              </tr>

              <tr>
                <td
                  colSpan={3}
                  style={{
                    border: "1px solid black",
                    fontFamily: "calibri",
                    padding: "5px",
                    fontSize: "11pt",
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
                    fontSize: "11pt",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {formatRupiah(data?.total_payment)},-
                </td>
              </tr>

              {data?.payment_type === "cicilan" && (
                <>
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        border: "1px solid black",
                        fontFamily: "calibri",
                        padding: "5px",
                        fontSize: "11pt",
                        fontWeight: "bold",
                      }}
                    >
                      Uang Muka
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        fontFamily: "calibri",
                        padding: "5px",
                        fontSize: "11pt",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      {formatRupiah(data?.down_payment)},-
                    </td>
                  </tr>

                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        border: "1px solid black",
                        fontFamily: "calibri",
                        padding: "5px",
                        fontSize: "11pt",
                        fontWeight: "bold",
                      }}
                    >
                      Sisa Tagihan
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        fontFamily: "calibri",
                        padding: "5px",
                        fontSize: "11pt",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      {formatRupiah(data?.remaining_payment)},-
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </Grid>

        {/* Pembayaran Cicilan */}
        <Grid size={12}>
          {data?.payment_type === "cicilan" && (
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                fontSize: "11pt",
              }}
            >
              <thead>
                <tr>
                  <th
                    colSpan={4}
                    style={{
                      border: "1px solid black",
                      padding: "5px",
                      fontWeight: "bold",
                      textAlign: "center",
                      fontSize: "12pt",
                      fontFamily: "calibri",
                    }}
                  >
                    Rencana Cicilan
                  </th>
                </tr>
                <tr>
                  <th
                    style={{
                      border: "1px solid black",
                      fontFamily: "calibri",
                      padding: "5px",
                      fontSize: "11pt",
                    }}
                  >
                    Tahap Pembayaran
                  </th>
                  <th
                    style={{
                      border: "1px solid black",
                      fontFamily: "calibri",
                      padding: "5px",
                      fontSize: "11pt",
                    }}
                  >
                    Tanggal Pembayaran
                  </th>
                  <th
                    style={{
                      border: "1px solid black",
                      fontFamily: "calibri",
                      padding: "5px",
                      fontSize: "11pt",
                    }}
                  >
                    Total Pembayaran
                  </th>
                </tr>
              </thead>
              <tbody>
                {installments
                  .slice(0, data?.current_tenor)
                  .map((item, index) => (
                    <tr key={index}>
                      <td
                        style={{
                          fontSize: "11pt",
                          fontFamily: "calibri",
                          whiteSpace: "pre-line",
                          wordBreak: "break-all",
                          border: "solid 1px black",
                          padding: "5px",
                          textAlign: "center",
                        }}
                      >
                        {item?.label}
                      </td>
                      <td
                        style={{
                          fontSize: "11pt",
                          fontFamily: "calibri",
                          whiteSpace: "pre-line",
                          wordBreak: "break-all",
                          border: "solid 1px black",
                          padding: "5px",
                          textAlign: "center",
                        }}
                      >
                        {item?.month}
                      </td>
                      <td
                        style={{
                          border: "1px solid black",
                          fontFamily: "calibri",
                          padding: "5px",
                          fontSize: "11pt",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        {item?.amount},-
                      </td>
                    </tr>
                  ))}

                <tr>
                  <td
                    colSpan={2}
                    style={{
                      fontSize: "11pt",
                      fontFamily: "calibri",
                      whiteSpace: "pre-line",
                      wordBreak: "break-all",
                      border: "solid 1px black",
                      padding: "5px",
                      textAlign: "left",
                      fontWeight: "bold",
                    }}
                  >
                    Total Cicilan
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      fontFamily: "calibri",
                      padding: "5px",
                      fontSize: "11pt",
                      textAlign: "right",
                      fontWeight: "bold",
                    }}
                  >
                    {formatRupiah(totalInstallment)},-
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </Grid>

        <Grid size={12}>
          <Typography
            sx={{
              fontFamily: "calibri",
              textAlign: "justify",
              fontSize: "11pt",
            }}
          >
            Demikian permohonan ini kami sampaikan, kiranya dapat disetujui.
            Atas perhatian dan kerjasamanya diucapkan terima kasih.
          </Typography>
        </Grid>

        {/* TTD Penyewa */}
        <Grid container size={12} mt={4}>
          <Grid size={6}></Grid>
          <Grid size={6} align={"center"}>
            <Typography
              sx={{
                fontFamily: "calibri",
                fontSize: "11pt",
              }}
            >
              Hormat kami,
            </Typography>

            <Typography
              sx={{
                fontFamily: "calibri",
                textTransform: "capitalize",
                fontWeight: "bold",
                fontSize: "11pt",
                mt: 9,
              }}
            >
              {data?.tenant_name}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
});

export default SuratPernyataanPenyewa;
