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
const CARD_HEADER_BG = "/background-header-kartu-pedagang.png";
const CARD_WIDTH = "92mm";
const CARD_HEIGHT = "66mm";

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

const buildStallLabel = (stallNumber) => {
  const value = String(stallNumber || "").trim();
  if (!value) return "";
  return /^lahan\b/i.test(value) ? value : `Lahan ${value}`;
};

const chunkItems = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const FieldRow = ({ label, value, maxLines = 1 }) => {
  const shouldClamp = Number.isFinite(maxLines) && maxLines > 0;

  return (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "12.5mm 2mm minmax(0, 1fr)",
      columnGap: "0.75mm",
      alignItems: "start",
      minWidth: 0,
    }}
  >
    <Typography sx={{ ...cardText, fontSize: "5.7pt", fontWeight: 700 }}>
      {label}
    </Typography>
    <Typography sx={{ ...cardText, fontSize: "5.7pt", fontWeight: 700 }}>
      :
    </Typography>
    <Typography
      sx={{
        ...cardText,
        fontSize: "5.7pt",
        fontWeight: 700,
        lineHeight: 1.08,
        overflowWrap: "anywhere",
        ...(shouldClamp
          ? {
              display: "-webkit-box",
              WebkitLineClamp: maxLines,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }
          : {}),
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
  );
};

const HeaderLogoFrame = ({ children, circle = false }) => (
  <Box
    sx={{
      width: circle ? "10.2mm" : "11.8mm",
      height: circle ? "10.2mm" : "11.8mm",
      bgcolor: "#fff",
      border: "0.25mm solid rgba(0,0,0,0.28)",
      borderRadius: circle ? "50%" : "1.3mm",
      boxShadow: "0 0.25mm 0.65mm rgba(0,0,0,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
      zIndex: 1,
      transform: circle ? "translateY(-1mm)" : "translateY(-0.35mm)",
    }}
  >
    {children}
  </Box>
);

const TraderCardShell = ({ children }) => (
  <Box
    sx={{
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
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
  const locationInfo = [
    data.location_name,
    data.sector_name,
    buildStallLabel(data.stall_number),
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <TraderCardShell>
      <Box
        sx={{
          height: "15.6mm",
          bgcolor: "#fff",
          color: "#fff",
          display: "grid",
          gridTemplateColumns: "13.6mm minmax(0, 1fr) 13.6mm",
          alignItems: "center",
          px: "2.8mm",
          columnGap: "1.2mm",
          position: "relative",
          overflow: "hidden",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
          "& .trader-card-header-text": {
            color: "#fff !important",
            WebkitTextFillColor: "#fff !important",
            opacity: "1 !important",
            textShadow: "none !important",
            filter: "none !important",
            mixBlendMode: "normal",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          },
        }}
      >
        <Box
          component="img"
          src={CARD_HEADER_BG}
          alt=""
          aria-hidden="true"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
            zIndex: 0,
          }}
        />
        <HeaderLogoFrame>
          <Box
            component="img"
            src={CITY_LOGO}
            alt="Logo Pemerintah Kota Manado"
            sx={{ width: "10.4mm", height: "10.4mm", objectFit: "contain" }}
          />
        </HeaderLogoFrame>
        <Box sx={{ minWidth: 0, textAlign: "center", position: "relative", zIndex: 1 }}>
          <Typography
            className="trader-card-header-text"
            sx={{
              m: 0,
              mb: "1mm",
              color: "#fff !important",
              WebkitTextFillColor: "#fff !important",
              opacity: 1,
              fontFamily: '"Arial Black", Impact, Arial, sans-serif',
              fontSize: "9.4pt",
              fontWeight: 900,
              lineHeight: 0.94,
              textShadow: "none",
              letterSpacing: "0",
            }}
          >
            PERUMDA PASAR MANADO
          </Typography>
          <Typography
            className="trader-card-header-text"
            sx={{
              m: 0,
              mb: "1mm",
              color: "#fff !important",
              WebkitTextFillColor: "#fff !important",
              opacity: 1,
              fontFamily: '"Arial", "Calibri", sans-serif',
              fontSize: "5.8pt",
              fontWeight: 700,
              lineHeight: 0.95,
              textShadow: "none",
              letterSpacing: "0",
            }}
          >
            (BADAN USAHA MILIK DAERAH KOTA MANADO)
          </Typography>
          <Typography
            className="trader-card-header-text"
            sx={{
              m: 0,
              color: "#fff !important",
              WebkitTextFillColor: "#fff !important",
              opacity: 1,
              fontFamily: '"Arial", "Calibri", sans-serif',
              fontSize: "5.5pt",
              lineHeight: 0.95,
              fontWeight: 600,
              textShadow: "none",
              letterSpacing: "0",
            }}
          >
            Kompleks Gedung Shopping Center Lt II
          </Typography>
        </Box>
        <HeaderLogoFrame circle>
          <Box
            component="img"
            src={PM_LOGO}
            alt="Logo PM"
            sx={{
              width: "8.9mm",
              height: "8.9mm",
              objectFit: "contain",
            }}
          />
        </HeaderLogoFrame>
      </Box>

      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "15.6mm",
          height: "0",
          bgcolor: "transparent",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          inset: "15.95mm 0 0 0",
          background:
            "repeating-linear-gradient(0deg, rgba(215,25,32,0.05) 0, rgba(215,25,32,0.05) 0.12mm, transparent 0.12mm, transparent 4.4mm), repeating-linear-gradient(90deg, rgba(215,25,32,0.05) 0, rgba(215,25,32,0.05) 0.12mm, transparent 0.12mm, transparent 17mm)",
        }}
      />

      <Box
        sx={{
          position: "relative",
          height: "50.05mm",
          boxSizing: "border-box",
          px: "3mm",
          pt: "2mm",
        }}
      >
        <Typography
          sx={{
            ...cardText,
            textAlign: "center",
            fontFamily: '"Arial Black", Impact, Arial, sans-serif',
            fontSize: "7.1pt",
            fontWeight: 900,
            lineHeight: 1,
            mt: "0.7mm",
            mb: "2mm",
          }}
        >
          KARTU TANDA PEDAGANG
        </Typography>

        <Box
          sx={{
            position: "absolute",
            top: "2.3mm",
            right: "3.2mm",
            width: "20mm",
            height: "27mm",
            border: "0.6mm solid #d71920",
            bgcolor: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            zIndex: 2,
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
            <Typography sx={{ ...cardText, fontSize: "4.4pt", textAlign: "center" }}>
              Pas Foto
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            pr: "24.5mm",
            maxHeight: "31mm",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Box sx={{ minWidth: 0, display: "grid", rowGap: "0.42mm" }}>
            <FieldRow label="Nomor" value={buildCardNumber(data.document_number)} />
            <FieldRow label="Nama" value={data.tenant_name} />
            <FieldRow label="TTL" value={birthInfo || "-"} />
            <FieldRow label="Alamat" value={buildAddress(data) || "-"} maxLines={0} />
            <FieldRow label="Lokasi" value={locationInfo || "-"} maxLines={0} />
          </Box>
        </Box>

        <Box
          sx={{
            position: "absolute",
            left: "3mm",
            right: "3mm",
            bottom: "1.2mm",
            display: "grid",
            gridTemplateColumns: "23mm minmax(0, 1fr) 20mm",
            columnGap: "4mm",
            alignItems: "end",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: 75,
              height: 75,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QRCode
              value={buildVerificationUrl(data.qr_token)}
              type="svg"
              size={75}
              bordered={false}
              errorLevel="H"
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
                width: 20,
                height: 20,
                objectFit: "contain",
                transform: "translate(-50%, -50%)",
                bgcolor: "#fff",
                borderRadius: "50%",
                p: "1.5px",
              }}
            />
          </Box>

          <Box
            sx={{
              textAlign: "center",
              alignSelf: "end",
              gridColumn: "2 / 3",
              pb: "0.5mm",
              pr: "0",
              minHeight: "13.2mm",
            }}
          >
            <Typography
              sx={{
                ...cardText,
                fontFamily: '"Arial Black", Impact, Arial, sans-serif',
                fontSize: "5.9pt",
                fontWeight: 900,
              }}
            >
              DIREKTUR UTAMA
            </Typography>
            <Box sx={{ height: "8.2mm" }} />
            <Typography
              sx={{
                ...cardText,
                fontFamily: '"Arial Black", Impact, Arial, sans-serif',
                fontSize: "5.35pt",
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
      gridTemplateColumns: `repeat(2, ${CARD_WIDTH})`,
      gridAutoRows: CARD_HEIGHT,
      gap: "5mm",
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
