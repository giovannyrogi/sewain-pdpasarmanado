"use client";

import React, { forwardRef } from "react";
import { Box, Typography } from "@mui/material";
import { QRCode } from "antd";
import moment from "moment";
import "moment/locale/id";
import DocumentHeader2 from "./DocumentHeader2";
import formatRupiah from "@/app/components/formatrupiah/page";
import { formatNumber } from "@/app/utils/formatNumber";
import { getUploadApiUrl } from "@/app/utils/uploadPath";

const bodyText = {
  m: 0,
  color: "#000",
  fontFamily: '"Arial", "Calibri", sans-serif',
  fontSize: "9pt",
  lineHeight: 1.25,
  textAlign: "justify",
};

const sectionLayout = {
  display: "grid",
  gridTemplateColumns: "8mm minmax(0, 1fr)",
  columnGap: "2.5mm",
};

const sectionLabel = {
  ...bodyText,
  fontWeight: 700,
  textAlign: "left",
  whiteSpace: "nowrap",
  mb: "3mm",
};

const sectionContentIndent = "5mm";

const buildAddress = (data) => {
  const rtRw =
    data?.rt || data?.rw ? `RT ${data?.rt || "-"} / RW ${data?.rw || "-"}` : "";

  return [
    data?.street_address,
    rtRw,
    data?.kelurahan,
    data?.district,
    data?.city,
    data?.province,
  ]
    .filter(Boolean)
    .join(", ");
};

const formatDate = (value) =>
  value && moment(value).isValid()
    ? moment(value).locale("id").format("D MMMM YYYY")
    : "-";

const NumberedItem = ({ number, children }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "15px minmax(0, 1fr)",
      columnGap: "5px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    }}
  >
    <Typography sx={bodyText}>{number}.</Typography>
    <Typography component="div" sx={bodyText}>
      {children}
    </Typography>
  </Box>
);

const LetteredItem = ({ marker, children }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "13px minmax(0, 1fr)",
      columnGap: "4px",
      ml: "20px",
    }}
  >
    <Typography sx={bodyText}>{marker}.</Typography>
    <Typography component="div" sx={bodyText}>
      {children}
    </Typography>
  </Box>
);

const buildVerificationUrl = (token) => {
  if (!token) return "SEWAIN-LAND-PERMIT-NO-TOKEN";

  const path = `/verify/izin-lahan/${token}`;
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();
  const runtimeBaseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const baseUrl = configuredBaseUrl || runtimeBaseUrl;

  if (!baseUrl) return path;

  return `${baseUrl.replace(/\/$/, "")}${path}`;
};

const SuratIzinLahan = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const photoUrl = getUploadApiUrl(data.profile_photo_file_path);
  const printedDate = formatDate(new Date());
  const birthInfo = [data.birth_place, formatDate(data.birth_date)]
    .filter(Boolean)
    .join(", ");
  const dimensions = `${formatNumber(data.stall_length)} x ${formatNumber(
    data.stall_width,
  )} m²`;
  const tradeAndStall = `${data.commodity_type || "-"} / ${
    data.stall_number || "-"
  } (Pasar ${data.location_name || "-"})`;
  const verificationUrl = buildVerificationUrl(data.qr_token);

  return (
    <Box
      ref={ref}
      className="land-permit-document"
      sx={{
        width: "100%",
        minHeight: "100vh",
        boxSizing: "border-box",
        bgcolor: "#fff",
        color: "#000",
        px: "13mm",
        pt: "8mm",
        pb: "10mm",
        fontFamily: '"Arial", "Calibri", sans-serif',
      }}
    >
      <DocumentHeader2 />

      <Box sx={{ textAlign: "center", mt: "1.5mm", mb: "5mm" }}>
        <Typography
          sx={{
            color: "#000",
            fontSize: "12pt",
            lineHeight: 1.05,
            fontWeight: 700,
            textDecoration: "underline",
          }}
        >
          SURAT IZIN LAHAN
        </Typography>
        <Typography
          sx={{ ...bodyText, textAlign: "center", fontSize: "9.2pt" }}
        >
          Nomor: {data.document_number || "-"}
        </Typography>
      </Box>

      <Box sx={{ mb: "6mm" }}>
        <Typography
          sx={{
            ...sectionLabel,
            letterSpacing: "3px",
          }}
        >
          I. DASAR :
        </Typography>

        <Box
          sx={{
            display: "grid",
            rowGap: "1.8mm",
            ml: sectionContentIndent,
          }}
        >
          <NumberedItem number="1">
            Peraturan Daerah Kota Manado Nomor 2 Tahun 2024 Tentang Perusahaan
            Umum Daerah Pasar Manado.
          </NumberedItem>
          <NumberedItem number="2">
            Peraturan Direksi Perusahaan Daerah Pasar Kota Manado Nomor: 04
            Tahun 2024 Tentang Penetapan Iuran Kontrak pemakaian Tempat usaha,
            Pengelolaan Pasar, Kebersihan, Jasa Parkir, Reklame, dan Promosi
            Serta Iuran Jasa Administrasi.
          </NumberedItem>
        </Box>
      </Box>

      <Box
        sx={{
          ...sectionLayout,
          mb: "6mm",
        }}
      >
        <Typography sx={sectionLabel}>II.</Typography>
        <Box sx={{ ml: "-6mm" }}>
          <Typography sx={{ ...bodyText, fontWeight: 700, mb: "4mm" }}>
            Setelah meneliti dan mengkaji kelayakan pemberian Surat Izin Lahan
            ini, maka dengan ini dinyatakan layak untuk diberikan izin kepada:
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "37mm 4mm minmax(0, 1fr)",
              rowGap: "1.5mm",
              ml: "19mm",
            }}
          >
            {[
              ["N a m a", data.tenant_name || "-"],
              ["NIK", data.tenant_nik || "-"],
              ["Tempat/Tanggal lahir", birthInfo || "-"],
              ["Alamat Rumah", buildAddress(data) || "-"],
              ["Jenis Jualan/No Lapak", tradeAndStall],
              ["Luas Tempat Usaha", dimensions],
              ["Iuran Jasa Administrasi", formatRupiah(data.total_payment)],
            ].map(([label, value]) => (
              <React.Fragment key={label}>
                <Typography
                  sx={{ ...bodyText, fontWeight: 700, textAlign: "left" }}
                >
                  {label}
                </Typography>
                <Typography
                  sx={{ ...bodyText, fontWeight: 700, textAlign: "left" }}
                >
                  :
                </Typography>
                <Typography
                  sx={{ ...bodyText, fontWeight: 700, textAlign: "left" }}
                >
                  {value}
                </Typography>
              </React.Fragment>
            ))}
          </Box>
        </Box>
      </Box>

      <Box sx={sectionLayout}>
        <Typography sx={sectionLabel}>III.</Typography>
        <Box sx={{ ml: "-6mm" }}>
          <Typography sx={{ ...bodyText, fontWeight: 700, mb: "2.8mm" }}>
            Pengusaha/Pedagang selama melaksanakan usaha, memperhatikan
            ketentuan-ketentuan sebagai berikut:
          </Typography>
          <Box sx={{ display: "grid", rowGap: "1.5mm" }}>
            <NumberedItem number="1">
              Surat Izin Lahan ini tidak dapat dipindah tangankan/disewakan
              kepada pihak lain tanpa sepengetahuan dan persetujuan Perusahaan
              Umum Daerah Pasar Manado.
            </NumberedItem>
            <NumberedItem number="2">
              Pengusaha/Pedagang diwajibkan mentaati ketentuan yang berlaku di
              Perusahaan Umum Daerah Pasar Manado serta tetap menjaga keamanan,
              kenyamanan dan kebersihan lingkungan di sekitar tempat usaha /
              berdagang.
            </NumberedItem>
            <Box>
              <NumberedItem number="3">
                Surat Izin Lahan ini dapat dicabut/dibatalkan dan ditinjau
                kembali bilamana terjadi hal-hal:
              </NumberedItem>
              <Box sx={{ display: "grid", rowGap: "0.7mm", mt: "0.7mm" }}>
                <LetteredItem marker="a">
                  Tidak mematuhi ketentuan/peraturan yang berlaku di Perusahaan
                  Umum Daerah Pasar Manado.
                </LetteredItem>
                <LetteredItem marker="b">
                  Melakukan hal-hal yang merugikan Perusahaan Umum Daerah Pasar
                  Manado.
                </LetteredItem>
                <LetteredItem marker="c">
                  Adanya perencanaan kembali lokasi tersebut dari Pemerintah
                  Kota (Perusahaan Umum Daerah Pasar Manado).
                </LetteredItem>
              </Box>
            </Box>
            <NumberedItem number="4">
              Surat Izin Lahan ini sewaktu-waktu dapat diperlihatkan kepada
              Petugas yang berwenang.
            </NumberedItem>
            <NumberedItem number="5">
              Surat Izin Lahan ini berlaku selama{" "}
              {data.lease_duration_years || 1} ({data.lease_duration_years || 1}
              ) Tahun terhitung sejak tanggal ditetapkan dan dapat diperpanjang
              kembali sesudah Pengusaha / Pedagang menyelesaikan administrasinya
              di Perusahaan Umum Daerah Pasar Manado.
            </NumberedItem>
            <NumberedItem number="6">
              Surat Izin Lahan ini berlaku sejak tanggal{" "}
              <Box component="span" sx={{ fontWeight: 700 }}>
                {formatDate(data.start_date)}
              </Box>{" "}
              s/d tanggal{" "}
              <Box component="span" sx={{ fontWeight: 700 }}>
                {formatDate(data.end_date)}
              </Box>
              .
            </NumberedItem>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "42mm 24mm minmax(0, 1fr)",
          columnGap: "25mm",
          alignItems: "start",
          mt: "5mm",
          breakInside: "avoid",
          pageBreakInside: "avoid",
          ml: "6mm",
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            justifyContent: "flex-start",
            width: 138,
            height: 138,
          }}
        >
          <QRCode
            value={verificationUrl}
            size={138}
            bordered={false}
            errorLevel="M"
            color="#E60909"
          />
          <Box
            component="img"
            src="/logo-pm-red-transparent.png"
            alt="Logo PM QR"
            sx={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 40,
              height: 40,
              objectFit: "contain",
              transform: "translate(-50%, -50%)",
              bgcolor: "#fff",
              borderRadius: "50%",
              p: "3px",
            }}
          />
        </Box>

        <Box
          sx={{
            width: "20mm",
            height: "27mm",
            border: "1px solid #000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          {photoUrl ? (
            <Box
              component="img"
              src={photoUrl}
              alt="Pas foto pedagang"
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Typography
              sx={{
                ...bodyText,
                px: "1.5mm",
                fontSize: "7.2pt",
                textAlign: "center",
              }}
            >
              Belum ada pas foto 3x4
            </Typography>
          )}
        </Box>

        <Box sx={{ textAlign: "center", pt: "0.5mm" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "28mm 4mm minmax(0, 1fr)",
              textAlign: "left",
            }}
          >
            <Typography sx={bodyText}>Dikeluarkan di</Typography>
            <Typography sx={bodyText}>:</Typography>
            <Typography
              sx={{ ...bodyText, fontWeight: 700, letterSpacing: "4px" }}
            >
              Manado
            </Typography>
            <Typography sx={bodyText}>Pada Tanggal</Typography>
            <Typography sx={bodyText}>:</Typography>
            <Typography sx={{ ...bodyText, fontWeight: 700 }}>
              {printedDate}
            </Typography>
          </Box>
          <Typography
            sx={{
              ...bodyText,
              mt: "3mm",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            DIREKTUR UTAMA
          </Typography>
          <Box sx={{ height: "16mm" }} />
          <Typography
            sx={{
              ...bodyText,
              fontWeight: 700,
              textAlign: "center",
              textDecoration: "underline",
            }}
          >
            LUCKY A. SENDUK, S.Ked
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});

SuratIzinLahan.displayName = "SuratIzinLahan";

export default SuratIzinLahan;
