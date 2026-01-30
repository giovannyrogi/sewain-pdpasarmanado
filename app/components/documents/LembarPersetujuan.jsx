"use client";
import { Box, Divider, Grid, Typography } from "@mui/material";
import moment from "moment";
import React, { forwardRef } from "react";
import formatRupiah from "../formatrupiah/page";
import Image from "next/image";

const LembarPersetujuan = forwardRef(({ data }, ref) => {
  if (!data) return null;

  console.log("data", data);

  return (
    <Box ref={ref} sx={{ padding: "100px 50px 0px 30px" }}>
      <Grid container spacing={1}>
        {/* Nomor Dokumen */}
        <Grid
          sx={{
            position: "absolute",
            // top: 30,
            top: 1180,
            left: 560,
            border: "1px solid black",
            padding: "5px 70px",
          }}
        >
          <Typography
            sx={{
              fontSize: "50px",
              fontFamily: "calibri",
              fontWeight: "bold",
            }}
          >
            2
          </Typography>
        </Grid>
        {/* Tanggal */}
        {/* <Typography
            sx={{
              fontFamily: "calibri",
            }}
          >
            Manado,{moment(new Date()).format("D MMMM YYYY")}
          </Typography> */}
        <Grid size={12} align="center">
          <Typography
            sx={{
              fontSize: "20px",
              fontFamily: "calibri",
              fontWeight: "bold",
              textDecoration: "underline",
            }}
          >
            LEMBAR PERSETUJUAN
          </Typography>
        </Grid>

        <Grid size={12} display={"flex"} flexDirection={"row"} gap={4.7} mt={4}>
          <Typography
            sx={{
              fontSize: "14px",
              fontFamily: "calibri",
              fontWeight: "bold",
            }}
          >
            Tanggal
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              fontFamily: "calibri",
              fontWeight: "bold",
            }}
          >
            : Manado, {moment(new Date()).format("D MMMM YYYY")}
          </Typography>
        </Grid>

        <Grid size={12} display={"flex"} flexDirection={"row"} gap={5}>
          <Typography
            sx={{
              fontSize: "14px",
              fontFamily: "calibri",
              fontWeight: "bold",
            }}
          >
            Perihal
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              fontFamily: "calibri",
              fontWeight: "bold",
            }}
          >
            : Permohonan untuk pembayaran kontrak ruangan No.{" "}
            {data?.room_number}, {data?.location_name}, {data?.tenant_name}.
          </Typography>
        </Grid>
      </Grid>

      <table
        style={{
          borderCollapse: "collapse",
          fontSize: "12px",
          marginTop: "30px",
          width: "100%",
        }}
      >
        <thead>
          <tr style={{ height: "40px" }}>
            <th
              style={{
                border: "1px solid black",
                padding: "5px",
                fontWeight: "bold",
                textAlign: "center",
                fontSize: "14px",
                fontFamily: "calibri",
                width: "50px",
              }}
            >
              No
            </th>
            <th
              style={{
                border: "1px solid black",
                padding: "5px",
                fontWeight: "bold",
                textAlign: "center",
                fontSize: "14px",
                fontFamily: "calibri",
                width: "300px",
              }}
            >
              Pengelolah
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
              Catatan
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
              Paraf
            </th>
          </tr>
        </thead>
        <tbody>
          {/* BARIS 1a */}
          <tr>
            {/* NO */}
            <td
              rowSpan={3}
              style={{
                border: "1px solid black",
                textAlign: "center",
                verticalAlign: "center",
                fontFamily: "calibri",
                fontSize: "14px",
                paddingTop: "5px",
              }}
            >
              1
            </td>

            {/* PENGELOLAH a */}
            <td
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                fontSize: "14px",
                padding: "5px",
                height: "80px",
              }}
            >
              Kelengkapan berkas
              <br />
              <span style={{ marginLeft: "20px" }}>
                a. Surat Permohonan dari yang bersangkutan
              </span>
            </td>

            {/* CATATAN a */}
            <td
              style={{
                border: "1px solid black",
                textAlign: "center",
                fontFamily: "calibri",
                fontSize: "14px",
              }}
            ></td>

            {/* PARAF */}
            <td
              rowSpan={3}
              style={{
                border: "1px solid black",
                textAlign: "center",
                verticalAlign: "middle",
                fontFamily: "calibri",
                fontSize: "14px",
              }}
            >
              {/* tanda tangan */}
            </td>
          </tr>

          {/* BARIS 1b */}
          <tr>
            <td
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                fontSize: "14px",
                padding: "5px",
                height: "80px",
              }}
            >
              <span style={{ marginLeft: "20px" }}>
                b. Foto Copy Kartu Tanda Penduduk
              </span>
            </td>

            <td
              style={{
                border: "1px solid black",
                textAlign: "center",
                fontFamily: "calibri",
                fontSize: "14px",
              }}
            ></td>
          </tr>

          {/* BARIS 1c */}
          <tr>
            <td
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                fontSize: "14px",
                padding: "5px",
                height: "80px",
              }}
            >
              <span style={{ marginLeft: "20px" }}>
                c. Surat Persetujuan Sewa Ruangan
              </span>
            </td>

            <td
              style={{
                border: "1px solid black",
                textAlign: "center",
                fontFamily: "calibri",
                fontSize: "14px",
              }}
            ></td>
          </tr>

          {/* BARIS 2 */}
          <tr>
            <td
              style={{
                border: "1px solid black",
                textAlign: "center",
                height: "80px",
                fontFamily: "calibri",
                fontSize: "14px",
              }}
            >
              2
            </td>
            <td
              style={{
                border: "1px solid black",
                padding: "5px",
                fontFamily: "calibri",
                fontSize: "14px",
              }}
            >
              Kepala Sub Divisi Sewa Kontrak dan Ijin Lahan
            </td>
            <td style={{ border: "1px solid black" }}></td>
            <td style={{ border: "1px solid black" }}></td>
          </tr>

          {/* BARIS 3 */}
          <tr>
            <td
              style={{
                border: "1px solid black",
                textAlign: "center",
                height: "80px",
                fontFamily: "calibri",
                fontSize: "14px",
              }}
            >
              3
            </td>
            <td
              style={{
                border: "1px solid black",
                padding: "5px",
                fontFamily: "calibri",
                fontSize: "14px",
              }}
            >
              Kepala Divisi Kerja Sama Bisnis
            </td>
            <td style={{ border: "1px solid black" }}></td>
            <td style={{ border: "1px solid black" }}></td>
          </tr>

          {/* BARIS 4 */}
          <tr>
            <td
              style={{
                border: "1px solid black",
                textAlign: "center",
                height: "80px",
                fontFamily: "calibri",
                fontSize: "14px",
              }}
            >
              4
            </td>
            <td
              style={{
                border: "1px solid black",
                padding: "5px",
                fontFamily: "calibri",
                fontSize: "14px",
              }}
            >
              Direktur Bisnis
            </td>
            <td style={{ border: "1px solid black" }}></td>
            <td style={{ border: "1px solid black" }}></td>
          </tr>

          {/* BARIS 5 */}
          <tr>
            <td
              style={{
                border: "1px solid black",
                textAlign: "center",
                height: "80px",
                fontFamily: "calibri",
                fontSize: "14px",
              }}
            >
              5
            </td>
            <td
              style={{
                border: "1px solid black",
                padding: "5px",
                fontFamily: "calibri",
                fontSize: "14px",
              }}
            >
              Direktur Utama
            </td>
            <td style={{ border: "1px solid black" }}></td>
            <td style={{ border: "1px solid black" }}></td>
          </tr>
        </tbody>
      </table>
    </Box>
  );
});

export default LembarPersetujuan;
