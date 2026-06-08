"use client";
import { Box, Divider, Grid, Typography } from "@mui/material";
import moment from "moment";
import React, { forwardRef } from "react";
import formatRupiah from "../formatrupiah/page";
import Image from "next/image";
import { formatNumber } from "@/app/utils/formatNumber";
import { buildPaymentDetail } from "@/app/utils/buildPaymentDetail";

const SuratPernyataanPenyewa = forwardRef(({ data }, ref) => {
  if (!data) return null;
  // console.log("data", data);

  const {
    totalPayment,
    annualRoomRent,
    leaseDurationYears,
    totalSewaKontrakRuangan,
    PPNDownPayment,
    nilaiKontrak,
    totalPPN,
    totalInstallment,
    remainingPayment,
  } = buildPaymentDetail(data) || {
    totalPayment: 0,
    annualRoomRent: 0,
    leaseDurationYears: 1,
    totalSewaKontrakRuangan: 0,
    PPNDownPayment: 0,
    nilaiKontrak: 0,
    totalPPN: 0,
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
                  Harga Ruangan / Tahun
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
                  {annualRoomRent ? formatRupiah(annualRoomRent) : "-"}
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
                  {formatRupiah(totalSewaKontrakRuangan)},-
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
                  Durasi Sewa
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
                  {leaseDurationYears} Tahun
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
