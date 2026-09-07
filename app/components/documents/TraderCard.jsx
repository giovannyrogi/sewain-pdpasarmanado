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
  left: 32.9,
  top: 35.5,
  size: 11.2,
  quietZone: 0.4,
  logoSize: 2.8,
  borderRadius: 8,
};
export const TRADER_CARD_QR_LAYOUT_BACK_CARD = {
  left: 45,
  top: 41,
  size: 11.2,
  quietZone: 0.4,
  logoSizeWidth: 4.5,
  logoSizeHeight: 1.4,
  borderRadius: 8,
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
const rules = [
  "Dilarang berjualan di lokasi yang tidak diijinkan.",
  "Dilarang menambah/merubah tempat berjualan tanpa seijin Perumda Pasar Manado.",
  "Kartu Pedagang ini hanya untuk tanda pengenal pedagang dan tidak berlaku sebagai penggunaan lahan tempat usaha.",
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
        src={`/template-id-card-pedagang-${side === "front" ? "depan" : "belakang"}.png`}
        alt=""
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
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
              left: "12mm",
              top: "1.2mm",
              width: "61.6mm",
              height: "7.9mm",
              textAlign: "center",
              fontSize: "5.4pt",
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
                fontSize: "8pt",
                mb: "0.3mm",
              }}
            >
              PERUMDA PASAR MANADO
            </Box>
            <Box>
              {administrationFullLabel(data.administration_type) === "KIP"
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
              // bgcolor: "#fff",
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
                width: `${TRADER_CARD_QR_LAYOUT_FRONT_CARD.size}mm`,
                height: `${TRADER_CARD_QR_LAYOUT_FRONT_CARD.size}mm`,
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
                p: "0.15mm",
                objectFit: "contain",
                bgcolor: "#fff",
                borderRadius: "50%",
                alignSelf: "center",
              }}
            />
          </Box>
          <Box
            data-card-content={identity}
            data-card-area="tanda tangan"
            sx={{
              position: "absolute",
              left: "47mm",
              top: "34.5mm",
              width: "35mm",
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

          <Box
            data-card-qr
            sx={{
              position: "absolute",
              left: `${TRADER_CARD_QR_LAYOUT_BACK_CARD.left}mm`,
              top: `${TRADER_CARD_QR_LAYOUT_BACK_CARD.top}mm`,
              width: `${TRADER_CARD_QR_LAYOUT_BACK_CARD.size}mm`,
              height: `${TRADER_CARD_QR_LAYOUT_BACK_CARD.size}mm`,
              // bgcolor: "#fff",
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
              // color="#E60909"
              bgColor="#fff"
              style={{
                display: "block",
                width: `${TRADER_CARD_QR_LAYOUT_BACK_CARD.size}mm`,
                height: `${TRADER_CARD_QR_LAYOUT_BACK_CARD.size}mm`,
                padding: `${TRADER_CARD_QR_LAYOUT_BACK_CARD.quietZone}mm`,
              }}
            />
            <Box
              component="img"
              src="/logo-mkp-new.png"
              alt="Logo MKP QR"
              loading="eager"
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: `${TRADER_CARD_QR_LAYOUT_BACK_CARD.logoSizeWidth}mm`,
                height: `${TRADER_CARD_QR_LAYOUT_BACK_CARD.logoSizeHeight}mm`,
                p: "0.18mm",
                objectFit: "contain",
                bgcolor: "#fff",
                alignSelf: "center",
                // borderRadius: "50%",
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
}
export function CalibrationCard({ slot, side }) {
  return (
    <Box
      sx={{
        ...text,
        width: `${W}mm`,
        height: `${H}mm`,
        border: "0.2mm solid #000",
        boxSizing: "border-box",
        p: "3mm",
        fontSize: "10pt",
        position: "relative",
      }}
    >
      <Box>
        ATAS - Slot {slot + 1} - {side === "front" ? "DEPAN" : "BELAKANG"}
      </Box>
      <Box
        sx={{
          mt: "4mm",
        }}
      >
        85,6 x 54 mm
      </Box>
      <Box
        sx={{
          width: "50mm",
          borderBottom: "0.3mm solid #000",
          mt: "8mm",
        }}
      >
        Garis ukur 50 mm
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: "3mm",
          left: "3mm",
        }}
      >
        KIRI BAWAH
      </Box>
    </Box>
  );
}
