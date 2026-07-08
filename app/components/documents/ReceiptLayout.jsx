"use client";

import { Box, Grid, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";
import moment from "moment";
import formatRupiah from "../formatrupiah/page";
import { rupiahInWords } from "@/app/utils/numberToWords";
import { calculatePaymentPphAmount } from "@/app/utils/calculatePphAmount";
import {
  buildReconciledPaymentBreakdown,
  hasReconciliationOtherAmount,
  roundCurrency,
} from "@/app/utils/paymentRoundingReconciliation";

const border = "1.2pt solid #000";
const fontFamily = "Arial, sans-serif";
const headerFont = "Times New Roman, serif";

const columnSize = {
  no: 0.6,
  description: 6.67,
  account: 2.06,
  amount: 2.67,
};

const signatureSize = {
  maker: 1.88,
  checker: 2.3,
  signer: 1.88,
  finance: 2.55,
  cashier: 3.39,
};

const bodyTextSx = {
  fontFamily,
  fontSize: "9pt",
  lineHeight: 1.45,
  letterSpacing: 0.5,
  fontWeight: 500,
  m: 0,
};

const labelTextSx = {
  fontFamily,
  fontSize: "9.75pt",
  fontWeight: 600,
  lineHeight: 1,
  m: 0,
};

const getPaymentLabel = (data) => {
  const paymentType = data?.tenant_application?.payment_type;
  const paymentNumber = Number(data?.payments?.payment_number || 1);

  if (paymentType === "lunas") return "Lunas";
  if (paymentNumber === 1) return "Uang Muka";
  return `Cicilan ${paymentNumber - 1}`;
};

const firstPositive = (...values) => {
  for (const value of values) {
    const number = Number(value || 0);
    if (number > 0) return number;
  }
  return 0;
};

const Text = ({ children, sx }) => (
  <Typography sx={{ ...bodyTextSx, ...sx }}>{children}</Typography>
);

const HeaderText = ({ children, sx }) => (
  <Typography sx={{ ...labelTextSx, ...sx }}>{children}</Typography>
);

const ReceiptLayout = ({
  data,
  receipt,
  variant = "white",
  type = "contract",
  breakAfter = true,
}) => {
  const isPph = type === "pph";
  const isLandPermit = type === "landPermit";
  const payment = data?.payments || {};
  const tenant = data?.tenant_application || {};
  const room = data?.room || {};
  const location = data?.location || {};
  const paymentLabel = getPaymentLabel(data);
  const isInstallmentPayment =
    !isPph && !isLandPermit && tenant.payment_type === "cicilan";
  const ppnAmount = firstPositive(
    receipt?.ppn_amount,
    payment.ppn_amount,
    tenant.total_ppn,
  );
  const contractAmount = firstPositive(
    receipt?.contract_amount,
    payment.contract_amount,
    tenant.total_payment_room,
    !isPph && receipt?.amount && ppnAmount ? receipt.amount - ppnAmount : 0,
    !isPph && payment.payment_amount && ppnAmount
      ? payment.payment_amount - ppnAmount
      : 0,
  );
  const reconciledPayment = buildReconciledPaymentBreakdown({
    paymentType: tenant.payment_type,
    paymentAmount: receipt?.amount || payment.payment_amount || payment.amount,
    contractAmount,
    ppnAmount,
  });
  const showOtherAmount =
    isInstallmentPayment &&
    hasReconciliationOtherAmount(reconciledPayment.otherAmount);
  const pphAmount = firstPositive(
    receipt?.pph_amount,
    calculatePaymentPphAmount({
      paymentType: tenant.payment_type,
      paymentAmount: payment.amount || payment.payment_amount,
      contractAmount,
      totalPaymentRoom: tenant.total_payment_room,
    }),
  );
  const totalAmount = isInstallmentPayment
    ? reconciledPayment.totalPlusPpn
    : roundCurrency(
        firstPositive(
          isPph ? pphAmount : receipt?.amount,
          isPph ? 0 : payment.payment_amount,
          isLandPermit ? tenant.total_payment : 0,
        ),
      );
  const title = isPph ? "KWITANSI PEMBAYARAN" : "KWITANSI PENERIMAAN";
  const receiptDate = receipt?.receipt_date || payment.payment_date;

  // ukuran asli kwitansi
  const RECEIPT_WIDTH = "210mm";
  const RECEIPT_HEIGHT = "148mm";

  // diperkecil agar tidak melewati garis potong tengah kertas
  const PRINT_SCALE = 0.9;

  // center horizontal:
  // (216 - (210 * 0.88)) / 2 = ±15.6mm
  const RECEIPT_TOP = "5mm";
  const RECEIPT_LEFT = "15mm";

  return (
    <Box
      sx={{
        width: RECEIPT_WIDTH,
        height: RECEIPT_HEIGHT,
        p: "5mm 6mm",
        mx: "auto",
        boxSizing: "border-box",
        color: "#000",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        overflow: "hidden",
        pageBreakAfter: breakAfter ? "always" : "auto",
        "@media print": {
          width: RECEIPT_WIDTH,
          height: RECEIPT_HEIGHT,
          p: "5mm 6mm",
          mx: "auto",
        },
      }}
    >
      <Box
        sx={{
          width: RECEIPT_WIDTH,
          height: RECEIPT_HEIGHT,
          p: "5mm 6mm",
          boxSizing: "border-box",
          color: "#000",
          overflow: "hidden",
          position: "absolute",
          top: RECEIPT_TOP,
          left: RECEIPT_LEFT,
          transform: `scale(${PRINT_SCALE})`,
          transformOrigin: "top left",
          "@media print": {
            width: RECEIPT_WIDTH,
            height: RECEIPT_HEIGHT,
            p: "5mm 6mm",
          },
        }}
      >
        <Grid
          container
          sx={{
            width: "198mm",
            height: "136mm",
            border,
            boxSizing: "border-box",
          }}
        >
          <Grid
            size={12}
            container
            sx={{ height: "26mm", borderBottom: border }}
          >
            <Grid
              size={9.33}
              container
              alignItems="center"
              sx={{ height: "100%", px: "3mm" }}
            >
              <Grid size={1.65} sx={{ display: "flex", alignItems: "center" }}>
                <Image
                  src="/logo-pemerintah-kota-manado-v2.png"
                  alt="Logo Pemerintah Kota Manado"
                  width={180}
                  height={180}
                  priority
                  sizes="18mm"
                  style={{
                    width: "18mm",
                    height: "18mm",
                    objectFit: "contain",
                  }}
                />
              </Grid>
              <Grid size={8.15} sx={{ textAlign: "center" }}>
                <Typography
                  sx={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: "16pt",
                    fontWeight: 600,
                    lineHeight: 0.9,
                    letterSpacing: 1,
                    m: 0,
                    mb: "0.8mm",
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: headerFont,
                    fontSize: "12.75pt",
                    fontWeight: 800,
                    lineHeight: 0.95,
                    letterSpacing: 0,
                    whiteSpace: "nowrap",
                    m: 0,
                    mb: "0.5mm",
                  }}
                >
                  PERUSAHAAN UMUM DAERAH KOTA MANADO
                </Typography>
                <Typography
                  sx={{
                    fontFamily: headerFont,
                    fontSize: "11.25pt",
                    fontWeight: 800,
                    lineHeight: 1.05,
                    m: 0,
                    mb: "0.7mm",
                  }}
                >
                  (Badan Usaha Milik Daerah Kota Manado)
                </Typography>
                <Typography
                  sx={{
                    fontFamily,
                    fontSize: "6.75pt",
                    lineHeight: 1.1,
                    fontWeight: 600,
                    mt: "1mm",
                  }}
                >
                  Kompleks Gedung Shopping Center Lt. II Manado Jl. Walanda
                  Maramis No. 123
                </Typography>
              </Grid>
              <Grid
                size={2.2}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  src="/logo-pm-new.png"
                  alt="Logo PD Pasar Manado"
                  width={220}
                  height={170}
                  priority
                  sizes="22mm"
                  style={{
                    width: "22mm",
                    height: "17mm",
                    objectFit: "contain",
                  }}
                />
              </Grid>
            </Grid>

            <Grid
              size={2.67}
              sx={{
                height: "100%",
                borderLeft: border,
                p: "6mm 3mm",
                boxSizing: "border-box",
              }}
            >
              <HeaderText sx={{ lineHeight: 2 }}>
                No. Bukti : {receipt?.receipt_number || ""}
              </HeaderText>
              <HeaderText sx={{ lineHeight: 2 }}>
                Tanggal :{" "}
                {receiptDate ? moment(receiptDate).format("D MMM YYYY") : ""}
              </HeaderText>
            </Grid>
          </Grid>

          <Grid
            size={12}
            container
            sx={{ height: "7mm", borderBottom: border, textAlign: "center" }}
          >
            <Grid size={columnSize.no} sx={{ borderRight: border }}>
              <HeaderText sx={{ lineHeight: "7mm" }}>No.</HeaderText>
            </Grid>
            <Grid size={columnSize.description} sx={{ borderRight: border }}>
              <HeaderText sx={{ lineHeight: "7mm" }}>Uraian</HeaderText>
            </Grid>
            <Grid size={columnSize.account} sx={{ borderRight: border }}>
              <HeaderText sx={{ lineHeight: "7mm" }}>No. Akun</HeaderText>
            </Grid>
            <Grid size={columnSize.amount}>
              <HeaderText sx={{ lineHeight: "7mm" }}>Jumlah (Rp)</HeaderText>
            </Grid>
          </Grid>

          <Grid
            size={12}
            container
            sx={{ height: "58mm", borderBottom: border }}
          >
            <Grid
              size={columnSize.no}
              sx={{ borderRight: border, pt: "5mm", textAlign: "center" }}
            />
            <Grid
              size={columnSize.description}
              sx={{
                borderRight: border,
                p: "5mm 4mm",
                boxSizing: "border-box",
              }}
            >
              {isLandPermit ? (
                <>
                  <Text>Izin Lahan</Text>
                  <Text>An. {tenant.tenant_name}</Text>
                  <Text>
                    {location.location_name || "-"}, Sektor{" "}
                    {data?.sector?.sector_name || "-"}, Lahan{" "}
                    {data?.stall?.stall_number || "-"}
                  </Text>
                  <Text>
                    Masa berlaku{" "}
                    {tenant.start_date
                      ? moment(tenant.start_date).format("D MMM YYYY")
                      : ""}{" "}
                    -{" "}
                    {tenant.end_date
                      ? moment(tenant.end_date).format("D MMM YYYY")
                      : ""}
                  </Text>
                </>
              ) : isPph ? (
                <>
                  <Text>Pajak PPH Psl 4(2)</Text>
                  <Text>An. {tenant.tenant_name}</Text>
                  <Text>
                    No. {room.room_number} {location.location_name}
                  </Text>
                </>
              ) : (
                <>
                  <Text>Kontrak</Text>
                  <Text>An. {tenant.tenant_name}</Text>
                  <Text>
                    No. {room.room_number} {location.location_name}
                  </Text>
                  <Text>
                    Nilai kontrak{" "}
                    {formatRupiah(tenant.total_payment_room || contractAmount)}
                  </Text>
                  <Text>
                    Masa berlaku{" "}
                    {tenant.start_date
                      ? moment(tenant.start_date).format("D MMM YYYY")
                      : ""}{" "}
                    -{" "}
                    {tenant.end_date
                      ? moment(tenant.end_date).format("D MMM YYYY")
                      : ""}
                  </Text>
                  <Text>PPN 11%</Text>
                  {showOtherAmount && <Text>Lainnya</Text>}
                  <Text>{paymentLabel}</Text>
                </>
              )}
            </Grid>
            <Grid
              size={columnSize.account}
              sx={{
                borderRight: border,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HeaderText>
                {isLandPermit
                  ? receipt?.account_code || ""
                  : receipt?.account_code || (isPph ? "5-192" : "4-250")}
              </HeaderText>
            </Grid>
            <Grid
              size={columnSize.amount}
              sx={{
                p: "9mm 5mm",
                boxSizing: "border-box",
                textAlign: "right",
              }}
            >
              {isLandPermit ? (
                <HeaderText sx={{ lineHeight: 2.15 }}>
                  {totalAmount > 0
                    ? formatRupiah(totalAmount, "hideRp")
                    : ""}
                </HeaderText>
              ) : isPph ? (
                <HeaderText sx={{ lineHeight: 2.15 }}>
                  {totalAmount > 0 ? formatRupiah(totalAmount, "hideRp") : ""}
                </HeaderText>
              ) : (
                <>
                  <HeaderText sx={{ lineHeight: 2.15 }}>
                    {reconciledPayment.contractAmount > 0
                      ? formatRupiah(reconciledPayment.contractAmount, "hideRp")
                      : ""}
                  </HeaderText>
                  <HeaderText sx={{ lineHeight: 2.15 }}>
                    {reconciledPayment.ppnAmount > 0
                      ? formatRupiah(reconciledPayment.ppnAmount, "hideRp")
                      : ""}
                  </HeaderText>
                  {showOtherAmount && (
                    <HeaderText sx={{ lineHeight: 2.15 }}>
                      {formatRupiah(reconciledPayment.otherAmount, "hideRp")}
                    </HeaderText>
                  )}
                </>
              )}
            </Grid>
          </Grid>

          <Grid
            size={12}
            container
            sx={{ height: "8mm", borderBottom: border }}
          >
            <Grid size={columnSize.no + columnSize.description} />
            <Grid
              size={columnSize.account}
              sx={{
                borderLeft: border,
                borderRight: border,
                textAlign: "right",
                pr: "2mm",
              }}
            >
              <HeaderText sx={{ lineHeight: "8mm" }}>Jumlah :</HeaderText>
            </Grid>
            <Grid
              size={columnSize.amount}
              sx={{ textAlign: "right", pr: "5mm" }}
            >
              <HeaderText sx={{ lineHeight: "8mm" }}>
                {totalAmount > 0 ? formatRupiah(totalAmount) : ""}
              </HeaderText>
            </Grid>
          </Grid>

          <Grid
            size={12}
            sx={{
              height: "14mm",
              borderBottom: border,
              p: "2.5mm",
              boxSizing: "border-box",
            }}
          >
            <Text>
              <Typography
                component="span"
                sx={{ ...bodyTextSx, fontWeight: 700 }}
              >
                Terbilang :
              </Typography>{" "}
              {totalAmount > 0 ? rupiahInWords(totalAmount) : ""}
            </Text>
          </Grid>

          <Grid
            size={12}
            container
            sx={{ height: "23mm", textAlign: "center" }}
          >
            {[
              ["Maker", signatureSize.maker],
              ["Cheker", signatureSize.checker],
              ["Signer", signatureSize.signer],
            ].map(([label, size]) => (
              <Grid key={label} size={size} sx={{ borderRight: border }}>
                <HeaderText
                  sx={{
                    height: "7mm",
                    lineHeight: "7mm",
                    borderBottom: border,
                  }}
                >
                  {label}
                </HeaderText>
              </Grid>
            ))}
            <Grid
              size={signatureSize.finance}
              sx={{ pt: "2mm", boxSizing: "border-box" }}
            >
              <HeaderText>
                {isPph ? "Kepala Bagian" : "Kepala Divisi"}
              </HeaderText>
              <HeaderText sx={{ mt: 0.2 }}>Keuangan</HeaderText>
              <HeaderText sx={{ mt: "8mm" }}>....................</HeaderText>
            </Grid>
            <Grid
              size={signatureSize.cashier}
              sx={{ pt: "2mm", boxSizing: "border-box" }}
            >
              <HeaderText>Manado, ...................... 20.....</HeaderText>
              <HeaderText sx={{ mt: 0.8 }}>
                {isPph ? "Penerima" : "Kasir"}
              </HeaderText>
              <HeaderText sx={{ mt: "8mm" }}>....................</HeaderText>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ReceiptLayout;
