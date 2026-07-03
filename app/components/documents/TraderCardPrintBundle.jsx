"use client";

import React, { forwardRef } from "react";
import { Box, Typography } from "@mui/material";
import { QRCode } from "antd";
import moment from "moment";
import "moment/locale/id";
import { getUploadApiUrl } from "@/app/utils/uploadPath";
import SuratIzinLahan from "./SuratIzinLahan";

const CARDS_PER_PAGE = 8;
const CITY_LOGO = "/logo-pemerintah-kota-manado-v2.png";
const PM_LOGO = "/logo-pm-new.png";
const QR_LOGO = "/logo-pm-red-transparent.png";

const cardText = {
  m: 0,
  color: "#111",
  fontFamily: '"Arial", "Calibri", sans-serif',
  lineHeight: 1.16,
};

const buildVerificationUrl = (token) => {
  if (!token) return "SEWAIN-LAND-PERMIT-NO-TOKEN";

  const path = `/verify/izin-lahan/${token}`;
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();
  const runtimeBaseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const baseUrl = configuredBaseUrl || runtimeBaseUrl;

  return baseUrl ? `${baseUrl.replace(/\/$/, "")}${path}` : path;
};

const formatDate = (value) =>
  value && moment(value).isValid()
    ? moment(value).locale("id").format("D MMMM YYYY")
    : "-";

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

const buildCardNumber = (documentNumber) => {
  const value = String(documentNumber || "").trim();
  if (!value) return "-";
  return value.replace("/SIL-", "/KTP-").replace("SIL-", "KTP-");
};

const chunkItems = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const FieldRow = ({ label, value }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "18mm 3mm minmax(0, 1fr)",
      columnGap: "1mm",
      alignItems: "start",
      minWidth: 0,
    }}
  >
    <Typography sx={{ ...cardText, fontSize: "6.1pt", fontWeight: 700 }}>
      {label}
    </Typography>
    <Typography sx={{ ...cardText, fontSize: "6.1pt", fontWeight: 700 }}>
      :
    </Typography>
    <Typography
      sx={{
        ...cardText,
        fontSize: "6.25pt",
        fontWeight: 700,
        overflowWrap: "anywhere",
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

const TraderCardShell = ({ children }) => (
  <Box
    sx={{
      width: "90mm",
      height: "58mm",
      boxSizing: "border-box",
      overflow: "hidden",
      bgcolor: "#fff",
      border: "0.35mm solid #d71920",
      borderRadius: "2mm",
      boxShadow: "inset 0 0 0 0.25mm rgba(0,0,0,0.22)",
      position: "relative",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    }}
  >
    {children}
  </Box>
);

const TraderCardFront = ({ data }) => {
  const photoUrl = getUploadApiUrl(data.profile_photo_file_path);
  const birthInfo = [data.birth_place, formatDate(data.birth_date)]
    .filter(Boolean)
    .join(", ");
  const locationInfo = [data.location_name, data.sector_name, data.stall_number]
    .filter(Boolean)
    .join(" / ");

  return (
    <TraderCardShell>
      <Box
        sx={{
          height: "14mm",
          bgcolor: "#d71920",
          color: "#fff",
          display: "grid",
          gridTemplateColumns: "14mm minmax(0, 1fr) 14mm",
          alignItems: "center",
          px: "2mm",
          columnGap: "1.5mm",
        }}
      >
        <Box
          component="img"
          src={CITY_LOGO}
          alt="Logo Pemerintah Kota Manado"
          sx={{ width: "11mm", height: "11mm", objectFit: "contain", bgcolor: "#fff" }}
        />
        <Box sx={{ minWidth: 0, textAlign: "center" }}>
          <Typography
            sx={{
              ...cardText,
              color: "#fff",
              fontFamily: '"Arial Black", Impact, Arial, sans-serif',
              fontSize: "8pt",
              fontWeight: 900,
              letterSpacing: "0.2mm",
            }}
          >
            PERUMDA PASAR MANADO
          </Typography>
          <Typography sx={{ ...cardText, color: "#fff", fontSize: "5.1pt", fontWeight: 700 }}>
            BADAN USAHA MILIK DAERAH KOTA MANADO
          </Typography>
          <Typography sx={{ ...cardText, color: "#fff", fontSize: "4.8pt" }}>
            Kompleks Gedung Shopping Center Lt II
          </Typography>
        </Box>
        <Box
          component="img"
          src={PM_LOGO}
          alt="Logo PM"
          sx={{
            width: "11mm",
            height: "11mm",
            objectFit: "contain",
            bgcolor: "#fff",
            borderRadius: "50%",
            p: "0.8mm",
          }}
        />
      </Box>

      <Box
        sx={{
          position: "absolute",
          inset: "14mm 0 0 0",
          background:
            "linear-gradient(135deg, rgba(215,25,32,0.06), rgba(255,255,255,0) 42%)",
        }}
      />

      <Box sx={{ position: "relative", px: "3mm", pt: "2.2mm" }}>
        <Typography
          sx={{
            ...cardText,
            textAlign: "center",
            fontFamily: '"Arial Black", Impact, Arial, sans-serif',
            fontSize: "7.3pt",
            fontWeight: 900,
            letterSpacing: "0.15mm",
            mb: "1.6mm",
          }}
        >
          KARTU TANDA PEDAGANG
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 18mm",
            columnGap: "2mm",
          }}
        >
          <Box sx={{ minWidth: 0, display: "grid", rowGap: "0.7mm" }}>
            <FieldRow label="Nomor" value={buildCardNumber(data.document_number)} />
            <FieldRow label="Nama" value={data.tenant_name} />
            <FieldRow label="TTL" value={birthInfo || "-"} />
            <FieldRow label="Alamat" value={buildAddress(data) || "-"} />
            <FieldRow label="Lokasi" value={locationInfo || "-"} />
          </Box>

          <Box
            sx={{
              width: "17mm",
              height: "22mm",
              border: "0.6mm solid #d71920",
              bgcolor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
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
              <Typography sx={{ ...cardText, fontSize: "4.6pt", textAlign: "center" }}>
                Pas Foto
              </Typography>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "22mm minmax(0, 1fr)",
            columnGap: "5mm",
            alignItems: "end",
            mt: "1.5mm",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: 82,
              height: 82,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QRCode
              value={buildVerificationUrl(data.qr_token)}
              size={82}
              bordered={false}
              errorLevel="M"
              color="#d71920"
            />
            <Box
              component="img"
              src={QR_LOGO}
              alt="Logo PM QR"
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 24,
                height: 24,
                objectFit: "contain",
                transform: "translate(-50%, -50%)",
                bgcolor: "#fff",
                borderRadius: "50%",
                p: "2px",
              }}
            />
          </Box>

          <Box sx={{ textAlign: "center", pb: "0.8mm" }}>
            <Typography
              sx={{
                ...cardText,
                fontFamily: '"Arial Black", Impact, Arial, sans-serif',
                fontSize: "6.4pt",
                fontWeight: 900,
              }}
            >
              DIREKTUR UTAMA
            </Typography>
            <Box sx={{ height: "7.5mm" }} />
            <Typography
              sx={{
                ...cardText,
                fontFamily: '"Arial Black", Impact, Arial, sans-serif',
                fontSize: "5.8pt",
                fontWeight: 900,
                textDecoration: "underline",
              }}
            >
              LUCKY A. SENDUK, S.Ked
            </Typography>
          </Box>
        </Box>
      </Box>
    </TraderCardShell>
  );
};

const TraderCardBack = ({ data }) => (
  <TraderCardShell>
    <Box
      component="img"
      src={PM_LOGO}
      alt=""
      aria-hidden="true"
      sx={{
        position: "absolute",
        width: "42mm",
        height: "42mm",
        objectFit: "contain",
        opacity: 0.1,
        left: "24mm",
        top: "10mm",
        filter: "grayscale(1)",
      }}
    />
    <Box
      sx={{
        position: "relative",
        height: "100%",
        boxSizing: "border-box",
        px: "5mm",
        py: "4mm",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography
        sx={{
          ...cardText,
          fontFamily: '"Arial Black", Impact, Arial, sans-serif',
          fontSize: "8pt",
          fontWeight: 900,
          textAlign: "center",
          letterSpacing: "0.1mm",
        }}
      >
        KETERANGAN MASA BERLAKU
      </Typography>
      <Typography
        sx={{
          ...cardText,
          fontFamily: '"Arial Black", Impact, Arial, sans-serif',
          fontSize: "7.2pt",
          fontWeight: 900,
          textAlign: "center",
          mb: "4mm",
        }}
      >
        {formatDate(data.start_date)} s/d {formatDate(data.end_date)}
      </Typography>

      <Box component="ol" sx={{ m: 0, pl: "5mm", display: "grid", rowGap: "2mm" }}>
        {[
          "Dilarang berjualan di lokasi yang tidak diijinkan.",
          "Dilarang menambah/merubah tempat berjualan tanpa seijin Perumda Pasar Manado.",
          "Kartu Pedagang ini hanya untuk tanda pengenal pedagang dan tidak berlaku sebagai penggunaan lahan tempat usaha.",
        ].map((item) => (
          <Typography
            key={item}
            component="li"
            sx={{
              ...cardText,
              fontSize: "6.6pt",
              fontWeight: 800,
              textAlign: "left",
            }}
          >
            {item}
          </Typography>
        ))}
      </Box>
    </Box>
  </TraderCardShell>
);

const TraderCardSheet = ({ items, side, pageIndex, breakAfterPage = true }) => (
  <Box
    className="trader-card-sheet"
    sx={{
      width: "210mm",
      minHeight: "297mm",
      boxSizing: "border-box",
      bgcolor: "#fff",
      color: "#111",
      px: "10mm",
      py: "12mm",
      display: "grid",
      gridTemplateColumns: "repeat(2, 90mm)",
      gridAutoRows: "58mm",
      gap: "6mm",
      justifyContent: "center",
      alignContent: "start",
      pageBreakAfter: breakAfterPage ? "always" : "auto",
      breakAfter: breakAfterPage ? "page" : "auto",
    }}
  >
    {items.map((item) =>
      side === "front" ? (
        <TraderCardFront key={`front-${pageIndex}-${item.document_id}`} data={item} />
      ) : (
        <TraderCardBack key={`back-${pageIndex}-${item.document_id}`} data={item} />
      ),
    )}
  </Box>
);

/**
 * Bundle print untuk Surat Izin Lahan dan Kartu Pedagang.
 * Mode manual duplex sengaja memisahkan semua halaman depan kartu dan halaman
 * belakang kartu agar admin bisa mencetak sisi depan dulu, lalu membalik kertas
 * dan mencetak sisi belakang dengan grid yang sama.
 */
const TraderCardPrintBundle = forwardRef(
  ({ documents = [], includePermit = false, includeCards = true }, ref) => {
    const frontChunks = chunkItems(documents, CARDS_PER_PAGE);
    const backChunks = chunkItems(documents, CARDS_PER_PAGE);

    return (
      <Box
        ref={ref}
        className="land-permit-print-bundle"
        sx={{
          bgcolor: "#fff",
          color: "#111",
          "@media print": {
            bgcolor: "#fff !important",
            color: "#111 !important",
          },
        }}
      >
        {includePermit &&
          documents.map((item, index) => (
            <Box
              key={`permit-${item.document_id}`}
              sx={{
                pageBreakAfter:
                  includeCards || index < documents.length - 1 ? "always" : "auto",
                breakAfter:
                  includeCards || index < documents.length - 1 ? "page" : "auto",
                "& .land-permit-document": {
                  minHeight: "100vh",
                },
              }}
            >
              {/* Surat tetap memakai komponen existing agar isi dokumen tidak berubah. */}
              <SuratIzinLahan data={item} />
            </Box>
          ))}

        {includeCards &&
          frontChunks.map((chunk, index) => (
            <TraderCardSheet
              key={`front-sheet-${index}`}
              items={chunk}
              side="front"
              pageIndex={index}
              breakAfterPage
            />
          ))}

        {includeCards &&
          backChunks.map((chunk, index) => (
            <TraderCardSheet
              key={`back-sheet-${index}`}
              items={chunk}
              side="back"
              pageIndex={index}
              breakAfterPage={index < backChunks.length - 1}
            />
          ))}
      </Box>
    );
  },
);

TraderCardPrintBundle.displayName = "TraderCardPrintBundle";

export { buildCardNumber };
export default TraderCardPrintBundle;
