"use client";
import { Box, Divider, Grid, Typography } from "@mui/material";
import moment from "moment";
import React, { forwardRef } from "react";
import formatRupiah from "../formatrupiah/page";
import Image from "next/image";

const LembarPersetujuan = forwardRef(({ data }, ref) => {
  if (!data) return null;

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
              fontSize: "40pt", 
              fontFamily: "Calibri",
              fontWeight: "bold",
            }}
          >
            {data?.document_number?.split("/")[0]}
          </Typography>
        </Grid>
        <Grid size={12} align="center">
          <Typography
            sx={{
              fontSize: "20pt",
              fontFamily: "calibri",
              fontWeight: "bold",
              textDecoration: "underline",
            }}
          >
            LEMBAR PERSETUJUAN
          </Typography>
        </Grid>

        <Grid size={12} display={"flex"} flexDirection={"row"} mt={4}>
          <Typography
            sx={{
              fontSize: "11pt",
              fontFamily: "calibri",
              fontWeight: "bold",
              marginRight: "30px",
            }}
          >
            Tanggal
          </Typography>
          <Typography
            sx={{
              fontSize: "11pt",
              fontFamily: "calibri",
              fontWeight: "bold",
              marginRight: "10px",
            }}
          >
            :
          </Typography>
          <Typography
            sx={{
              fontSize: "11pt",
              fontFamily: "calibri",
              fontWeight: "bold",
            }}
          >
            Manado, {moment(new Date()).format("D MMMM YYYY")}
          </Typography>
        </Grid>

        <Grid size={12} display={"flex"} flexDirection={"row"}>
          <Typography
            sx={{
              fontSize: "11pt",
              fontFamily: "calibri",
              fontWeight: "bold",
              marginRight: "33px",
            }}
          >
            Perihal
          </Typography>
          <Typography
            sx={{
              fontSize: "11pt",
              fontFamily: "calibri",
              fontWeight: "bold",
              marginRight: "10px",
            }}
          >
            :
          </Typography>
          <Typography
            sx={{
              fontSize: "11pt",
              fontFamily: "calibri",
              fontWeight: "bold",
            }}
          >
            Permohonan untuk pembayaran kontrak ruangan No. {data?.room_number},{" "}
            {data?.location_name}, {data?.tenant_name}.
          </Typography>
        </Grid>
      </Grid>

      <table
        style={{
          borderCollapse: "collapse",
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
                fontSize: "11pt",
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
                fontSize: "11pt",
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
                fontSize: "11pt",
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
                fontSize: "11pt",
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
                fontSize: "11pt",
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
                fontSize: "11pt",
                padding: "5px",
                height: "80px",
              }}
            >
              Kelengkapan berkas
              <br />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "left",
                  justifySelf: "center",
                  gap: "5px",
                }}
              >
                <span style={{ marginLeft: "20px" }}>a.</span>
                <span>Surat Permohonan dari yang bersangkutan</span>
              </Box>
            </td>

            {/* CATATAN a */}
            <td
              style={{
                border: "1px solid black",
                textAlign: "center",
                fontFamily: "calibri",
                fontSize: "11pt",
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
                fontSize: "11pt",
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
                fontSize: "11pt",
                padding: "5px",
                height: "80px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "left",
                  justifySelf: "center",
                  gap: "5px",
                }}
              >
                <span>b.</span>
                <span>Foto Copy Kartu Tanda Penduduk</span>
              </Box>
            </td>

            <td
              style={{
                border: "1px solid black",
                textAlign: "center",
                fontFamily: "calibri",
                fontSize: "11pt",
              }}
            ></td>
          </tr>

          {/* BARIS 1c */}
          <tr>
            <td
              style={{
                border: "1px solid black",
                fontFamily: "calibri",
                fontSize: "11pt",
                padding: "5px",
                height: "80px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "left",
                  justifySelf: "center",
                  gap: "5px",
                }}
              >
                <span>c.</span>
                <span>Surat Persetujuan Sewa Ruangan</span>
              </Box>
            </td>

            <td
              style={{
                border: "1px solid black",
                textAlign: "center",
                fontFamily: "calibri",
                fontSize: "11pt",
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
                fontSize: "11pt",
              }}
            >
              2
            </td>
            <td
              style={{
                border: "1px solid black",
                padding: "5px",
                fontFamily: "calibri",
                fontSize: "11pt",
              }}
            >
              Kepala Sub Divisi Pendapatan
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
                fontSize: "11pt",
              }}
            >
              3
            </td>
            <td
              style={{
                border: "1px solid black",
                padding: "5px",
                fontFamily: "calibri",
                fontSize: "11pt",
              }}
            >
              Kepala Divisi Pengelolaan Unit Usaha
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
                fontSize: "11pt",
              }}
            >
              4
            </td>
            <td
              style={{
                border: "1px solid black",
                padding: "5px",
                fontFamily: "calibri",
                fontSize: "11pt",
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
                fontSize: "11pt",
              }}
            >
              5
            </td>
            <td
              style={{
                border: "1px solid black",
                padding: "5px",
                fontFamily: "calibri",
                fontSize: "11pt",
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
