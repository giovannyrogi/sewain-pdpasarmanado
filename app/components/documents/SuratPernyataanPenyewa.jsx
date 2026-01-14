"use client";
import { Box, Divider, Grid, Typography } from "@mui/material";
import moment from "moment";
import React, { forwardRef } from "react";
import formatRupiah from "../formatrupiah/page";
import Image from "next/image";

const SuratPernyataanPenyewa = forwardRef(({ data }, ref) => {
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

  // console.log("data", data);

  return (
    <Box ref={ref} sx={{ padding: "30px 50px 0px 30px" }}>
      <Grid container spacing={1}>
        {/* Tanggal */}
        <Grid size={12} align={"end"}>
          <Typography
            sx={{
              fontFamily: "calibri",
            }}
          >
            Manado,{moment(new Date()).format("D MMMM YYYY")}
          </Typography>
        </Grid>

        <Grid size={12} mt={2}>
          <Typography
            sx={{
              fontFamily: "calibri",
            }}
          >
            Kepada Yth,
          </Typography>
        </Grid>

        <Grid size={12}>
          <Typography
            sx={{
              fontFamily: "calibri",
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
            }}
          >
            di-tempat
          </Typography>
        </Grid>

        <Grid size={12} mt={3}>
          <Typography
            sx={{
              fontFamily: "calibri",
            }}
          >
            Dengan hormat,
          </Typography>
        </Grid>

        <Grid size={12}>
          <Typography
            sx={{
              fontFamily: "calibri",
              textAlign: "justify",
            }}
          >
            Dengan ini kami mengajukan permohonan pembayaran{" "}
            {data?.payment_type === "cicilan" ? "Menyicil" : undefined} Kontrak
            Ruangan sebagai berikut :
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
                      "DD/MM/YYYY"
                    )} s/d ${moment(data?.end_date).format("DD/MM/YYYY")}`
                  : undefined,
            },
          ].map((item, index, arr) => (
            <Grid container size={12} key={index}>
              {/* Label */}
              <Grid size={2}>
                <Typography
                  sx={{
                    // fontSize: "14px",
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
                    // fontSize: "14px",
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
            }}
          >
            Demikian permohonan ini kami sampaikan, kiranya dapat disetujui.
            Atas perhatian dan kerjasamanya diucapkan terima kasih.
          </Typography>
        </Grid>

        <Grid size={12} mb={2}>
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
                  colSpan={4}
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: "14px",
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
                    fontSize: "13px",
                  }}
                >
                  Jenis Pembayaran
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
                    textAlign: "center",
                  }}
                >
                  {data?.payment_type === "cicilan" ? "Cicilan" : "Lunas"}
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
                  {data?.room_width ? data?.room_width + "M" : "-"} X{" "}
                  {data?.room_length ? data?.room_length + "M" : "-"} (
                  {data?.room_area ? data?.room_area + " M2" : "-"})
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
                  {data?.price_per_m2
                    ? formatRupiah(data?.price_per_m2) + "/M2"
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
                        fontSize: "13px",
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
                        fontSize: "13px",
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
                        fontSize: "13px",
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
                        fontSize: "13px",
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
                fontSize: "12px",
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
                      fontSize: "14px",
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
                      fontSize: "13px",
                    }}
                  >
                    Tahap Pembayaran
                  </th>
                  <th
                    style={{
                      border: "1px solid black",
                      fontFamily: "calibri",
                      padding: "5px",
                      fontSize: "13px",
                    }}
                  >
                    Tanggal Pembayaran
                  </th>
                  <th
                    style={{
                      border: "1px solid black",
                      fontFamily: "calibri",
                      padding: "5px",
                      fontSize: "13px",
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
                    {data?.estimated_installment_1 ? "Cicilan 1" : "-"}
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
                    {data?.estimated_installment_1_date
                      ? moment(data?.estimated_installment_1_date).format(
                          "MMMM YYYY"
                        )
                      : "-"}
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
                    {formatRupiah(data?.estimated_installment_1)},-
                  </td>
                </tr>

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
                    {data?.estimated_installment_2 ? "Cicilan 2" : "-"}
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
                    {data?.estimated_installment_2_date
                      ? moment(data?.estimated_installment_2_date).format(
                          "MMMM YYYY"
                        )
                      : "-"}
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
                    {formatRupiah(data?.estimated_installment_2)},-
                  </td>
                </tr>

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
                    {data?.estimated_installment_3 ? "Cicilan 3" : "-"}
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
                    {data?.estimated_installment_3_date
                      ? moment(data?.estimated_installment_3_date).format(
                          "MMMM YYYY"
                        )
                      : "-"}
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
                    {formatRupiah(data?.estimated_installment_3)},-
                  </td>
                </tr>

                <tr>
                  <td
                    colSpan={2}
                    style={{
                      fontSize: "12px",
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
                      fontSize: "13px",
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

        {/* TTD Penyewa */}
        <Grid container size={12} mt={4}>
          <Grid size={6}></Grid>
          <Grid size={6} align={"center"}>
            <Typography
              sx={{
                fontFamily: "calibri",
              }}
            >
              Hormat kami,
            </Typography>

            <Typography
              sx={{
                fontFamily: "calibri",
                textTransform: "capitalize",
                fontWeight: "bold",
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
