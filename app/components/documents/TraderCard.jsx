"use client";

import { Box } from "@mui/material";
import { QRCode } from "antd";
import moment from "moment";
import "moment/locale/id";
import {
  administrationLabel,
  administrationFullLabel,
  formatLandDocumentNumber,
  CARD_WIDTH_MM as W,
  CARD_HEIGHT_MM as H,
} from "@/app/utils/traderCardPrinting";
export const buildCardNumber = formatLandDocumentNumber;
// Semua ukuran dalam mm. Ubah di sini untuk menyesuaikan QR dengan bingkai template.
export const TRADER_CARD_QR_LAYOUT_FRONT_CARD = {
  // Keep the logo small and a white quiet zone around the high-correction QR.
  left: 33.5,
  top: 33.4,
  size: 17.5,
  quietZone: 1.3,
  logoSize: 2.6,
};
const date = (value) =>
  value && moment(value).isValid()
    ? moment(value).locale("id").format("D MMMM YYYY")
    : "-";
const text = {
  fontFamily: "Arial, sans-serif",
  fontWeight: 700,
  color: "#111",
  lineHeight: 1.16,
  letterSpacing: 0,
};
const kipRules = [
  "Dilarang berjualan di lokasi yang tidak diijinkan.",
  "Dilarang menambah/merubah tempat berjualan tanpa seijin Perumda Pasar Manado.",
  "Kartu Pedagang ini hanya untuk tanda pengenal pedagang dan tidak berlaku sebagai penggunaan lahan tempat usaha.",
];
const kkipRules = [
  "Dilarang berjualan di lokasi yang tidak diijinkan",
  "Dilarang melakukan transaksi jual beli ecer",
  "Kartu Khusus Identitas Pedagang ini hanya untuk Pedagang Bongkar Muat",
];
const verificationUrl = (token) => {
  const base =
    process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base.replace(/\/$/, "")}/verify/izin-lahan/${token}`;
};
export function TraderCard({ data, side }) {
  const identity = data.tenant_name || data.document_number || "Tanpa nama";
  const stall = String(data.stall_number || "").trim();
  const isKip = administrationLabel(data.administration_type) === "KIP";
  const rules = isKip ? kipRules : kkipRules;
  const location = [
    data.location_name,
    data.sector_name,
    isKip && stall
      ? /^lahan\b/i.test(stall)
        ? stall
        : `Lahan No. ${stall}`
      : "",
  ]
    .filter(Boolean)
    .join(" / ");
  const rows = [
    ["Nomor", buildCardNumber(data.document_number, data.administration_type)],
    ["Nama", data.tenant_name],
    [
      "TTL",
      [data.birth_place, date(data.birth_date)].filter(Boolean).join(", "),
    ],
    ["Lokasi", location],
    ["Jenis Administrasi", administrationFullLabel(data.administration_type)],
  ];
  return (
    <Box
      className="trader-card"
      sx={{
        ...text,
        width: `${W}mm`,
        height: `${H}mm`,
        position: "relative",
        overflow: "hidden",
        bgcolor: "#fff",
        boxSizing: "border-box",
        borderRadius: "2mm",
        "& *": {
          boxSizing: "border-box",
          // Keep global typography from changing the physical print layout.
          fontFamily: "inherit",
        },
      }}
    >
      <Box
        component="img"
        src={`/template-id-card-pedagang-${side === "front" ? "depan-v2" : "belakang"}.png`}
        alt=""
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: side === "front" ? "fill" : "cover",
        }}
        loading="eager"
      />
      {side === "front" ? (
        <>
          <Box
            data-card-content={identity}
            data-card-area="header"
            sx={{
              position: "absolute",
              left: "13mm",
              top: "1mm",
              width: "60mm",
              height: "8.4mm",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              textAlign: "center",
              fontSize: "5pt",
              lineHeight: 1.05,
              "&, & *": {
                color: "#fff !important",
                WebkitTextFillColor: "#fff !important",
                textShadow: "none",
                opacity: 1,
              },
            }}
          >
            <Box
              sx={{
                fontSize: "7.6pt",
                mb: "0.2mm",
              }}
            >
              PERUMDA PASAR MANADO
            </Box>
            <Box>
              {isKip
                ? "Kartu Identitas Pedagang(KIP)"
                : "Kartu Khusus Identitas Pedagang(KKIP)"}
            </Box>
          </Box>
          <Box
            data-card-content={identity}
            data-card-area="data pedagang"
            data-card-fit
            sx={{
              position: "absolute",
              left: "35.5mm",
              top: "12.5mm",
              width: "47.6mm",
              height: "19mm",
              fontSize: "5.6pt",
              overflowWrap: "anywhere",
            }}
          >
            {rows.map(([label, value]) => (
              <Box
                key={label}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "13mm 1.5mm minmax(0,1fr)",
                  mb: "0.2mm",
                  columnGap: "0.3mm",
                }}
              >
                <Box>{label}</Box>
                <Box>:</Box>
                <Box>{value || "-"}</Box>
              </Box>
            ))}
          </Box>
          <Box
            data-card-qr
            sx={{
              position: "absolute",
              left: `${TRADER_CARD_QR_LAYOUT_FRONT_CARD.left}mm`,
              top: `${TRADER_CARD_QR_LAYOUT_FRONT_CARD.top}mm`,
              width: `${TRADER_CARD_QR_LAYOUT_FRONT_CARD.size}mm`,
              height: `${TRADER_CARD_QR_LAYOUT_FRONT_CARD.size}mm`,
              bgcolor: "#fff",
              p: "0.2mm",
              border: "0.3mm solid #123452",
              borderRadius: "0.9mm",
              overflow: "hidden",
              "& svg": {
                display: "block",
                width: "100% !important",
                height: "100% !important",
              },
            }}
          >
            <QRCode
              type="svg"
              value={verificationUrl(data.qr_token)}
              errorLevel="H"
              size={200}
              bordered={false}
              color="#E60909"
              bgColor="#fff"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                // Inner radius follows the frame minus its border and padding.
                borderRadius: "0.4mm",
                padding: `${TRADER_CARD_QR_LAYOUT_FRONT_CARD.quietZone}mm`,
              }}
            />
            <Box
              component="img"
              src="/logo-pm-red-transparent.png"
              alt="Logo PM QR"
              loading="eager"
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: `${TRADER_CARD_QR_LAYOUT_FRONT_CARD.logoSize}mm`,
                height: `${TRADER_CARD_QR_LAYOUT_FRONT_CARD.logoSize}mm`,
                objectFit: "contain",
                bgcolor: "#fff",
                borderRadius: "50%",
                p: "0.3mm",
              }}
            />
          </Box>
          <Box
            data-card-content={identity}
            data-card-area="tanda tangan"
            sx={{
              position: "absolute",
              left: "52mm",
              top: "32.5mm",
              width: "31mm",
              height: "14mm",
              textAlign: "center",
              fontSize: "5.8pt",
            }}
          >
            <Box
              sx={{
                height: "8mm",
              }}
            />
            <Box
              sx={{
                textDecoration: "underline",
              }}
            >
              LUCKY A. SENDUK, S.Ked
            </Box>
            <Box>DIREKTUR UTAMA</Box>
          </Box>
        </>
      ) : (
        <>
          <Box
            sx={{
              position: "absolute",
              left: "4mm",
              top: "11mm",
              width: "37mm",
              height: "5mm",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              fontSize: "6.6pt",
            }}
          >
            MASA BERLAKU
          </Box>
          <Box
            data-card-content={identity}
            data-card-area="masa berlaku"
            sx={{
              position: "absolute",
              left: "44mm",
              top: "11mm",
              width: "39mm",
              height: "5mm",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontSize: "6.1pt",
            }}
          >
            <Box>
              {date(data.start_date)} s/d {date(data.end_date)}
            </Box>
          </Box>
          <Box
            component="ol"
            data-card-content={identity}
            data-card-area="aturan"
            sx={{
              position: "absolute",
              left: "4mm",
              top: "19mm",
              width: "76mm",
              height: "25mm",
              m: 0,
              pl: "4mm",
              fontSize: "7pt",
              lineHeight: 1.4,
            }}
          >
            {rules.map((rule) => (
              <Box
                component="li"
                key={rule}
                sx={{
                  mb: "2mm",
                }}
              >
                {rule}
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
