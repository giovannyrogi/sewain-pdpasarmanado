"use client";

import React, { forwardRef } from "react";
import { Box, Typography } from "@mui/material";
import DocumentHeader2 from "./DocumentHeader2";
import { formatNumber } from "@/app/utils/formatNumber";

const formatDocumentDate = (value = new Date()) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);

const buildIdentityAddress = (data) => {
  const rtRw =
    data?.rt || data?.rw
      ? `RT ${data?.rt || "-"} / RW ${data?.rw || "-"}`
      : "";

  return [
    data?.street_address,
    rtRw,
    data?.kelurahan,
    data?.district,
    data?.city,
    data?.province,
    data?.postal_code,
  ]
    .filter(Boolean)
    .join(", ");
};

const StatementItem = ({ number, children }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "18px minmax(0, 1fr)",
      columnGap: "5px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    }}
  >
    <Typography component="span" sx={styles.bodyText}>
      {number}.
    </Typography>
    <Typography component="div" sx={styles.bodyText}>
      {children}
    </Typography>
  </Box>
);

const SubStatementItem = ({ marker, children }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "14px minmax(0, 1fr)",
      columnGap: "4px",
      ml: "22px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    }}
  >
    <Typography component="span" sx={styles.bodyText}>
      {marker}.
    </Typography>
    <Typography component="div" sx={styles.bodyText}>
      {children}
    </Typography>
  </Box>
);

const Underlined = ({ children }) => (
  <Box component="span" sx={{ textDecoration: "underline" }}>
    {children}
  </Box>
);

const styles = {
  bodyText: {
    m: 0,
    color: "#000",
    fontFamily: '"Arial", "Calibri", sans-serif',
    fontSize: "8.7pt",
    fontWeight: 400,
    lineHeight: 1.22,
    textAlign: "justify",
  },
  smallText: {
    m: 0,
    color: "#000",
    fontFamily: '"Arial", "Calibri", sans-serif',
    fontSize: "7.7pt",
    lineHeight: 1.2,
  },
};

const SuratPernyataanIzinLahan = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const tenantName = data.tenant_name || "-";
  const address = buildIdentityAddress(data) || "-";
  const occupation = data.occupation || "-";
  const locationName = data.location_name || "-";
  const landLength = formatNumber(data.stall_length || 0);
  const landWidth = formatNumber(data.stall_width || 0);
  const landArea = formatNumber(
    data.stall_area ||
      Number(data.stall_length || 0) * Number(data.stall_width || 0),
  );
  const printedDate = formatDocumentDate();

  return (
    <Box
      ref={ref}
      className="land-permit-statement"
      sx={{
        width: "100%",
        boxSizing: "border-box",
        bgcolor: "#fff",
        color: "#000",
        padding: "30px 50px 0px 30px",
        fontFamily: '"Arial", "Calibri", sans-serif',
      }}
    >
      <DocumentHeader2 />

      <Typography
        component="h1"
        sx={{
          mt: "7mm",
          mb: "5mm",
          color: "#000",
          fontFamily: '"Arial", "Calibri", sans-serif',
          fontSize: "12pt",
          fontWeight: 700,
          letterSpacing: "4px",
          lineHeight: 1.15,
          textAlign: "center",
          textDecoration: "underline",
        }}
      >
        SURAT PERNYATAAN
      </Typography>

      <Typography sx={{ ...styles.bodyText, mb: "2.5mm", textAlign: "left" }}>
        Yang bertanda tangan di bawah ini:
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "24mm 4mm minmax(0, 1fr)",
          rowGap: "1mm",
          ml: "14mm",
          mb: "4mm",
        }}
      >
        {[
          ["Nama", tenantName],
          ["Alamat", address],
          ["Pekerjaan", occupation],
        ].map(([label, value]) => (
          <React.Fragment key={label}>
            <Typography sx={{ ...styles.bodyText, fontWeight: 700, textAlign: "left" }}>
              {label}
            </Typography>
            <Typography sx={{ ...styles.bodyText, fontWeight: 700, textAlign: "left" }}>
              :
            </Typography>
            <Typography sx={{ ...styles.bodyText, fontWeight: 400, textAlign: "left" }}>
              {value}
            </Typography>
          </React.Fragment>
        ))}
      </Box>

      <Typography sx={{ ...styles.bodyText, mb: "3mm" }}>
        Dengan ini menyatakan bahwa saya sebagai Pedagang yang diberikan kesempatan
        oleh Pemerintah untuk menempati (*) Pelataran Terbuka / Pelataran Beratap /
        Meja Kayu / Meja Permanen / Ruangan / Kios / Booth / Tenant di{" "}
        <Box component="span" sx={{ fontWeight: 700 }}>
          {locationName}
        </Box>{" "}
        dengan ukuran{" "}
        <Box component="span" sx={{ fontWeight: 700 }}>
          {landLength} m x {landWidth} m ({landArea} m²)
        </Box>{" "}
        akan menaati ketentuan-ketentuan sebagai berikut:
      </Typography>

      <Box sx={{ display: "grid", rowGap: "2.2mm" }}>
        <StatementItem number="1">
          Bahwa saya tidak akan merubah dan menambah dalam bentuk apapun tempat
          usaha tersebut di atas, tanpa persetujuanPERUMDA Pasar Kota Manado.
        </StatementItem>

        <StatementItem number="2">
          Bahwa saya bersedia membayar Iuran Pemanfaatan Area Pasar (iuran harian
          Pasar, Iuran Sewa Ruangan dan Iuran Jasa Kebersihan) sesuai ketentuan
          yang berlaku serta menaati peraturan baik yang ada sekarang maupun yang
          akan ditetapkan kemudian.
        </StatementItem>

        <StatementItem number="3">
          Dalam hal pemakaian tempat tersebut,{" "}
          <Box component="span" sx={{ fontWeight: 700 }}>
            saya tidak akan pindah tangankan/sewakan
          </Box>{" "}
          pada pihak lain{" "}
          <Box component="span" sx={{ fontWeight: 700 }}>
            tanpa sepengetahuan/persetujuan
          </Box>{" "}
          oleh Perusahaan Umum Daerah Pasar Kota Manado.
        </StatementItem>

        <Box sx={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
          <StatementItem number="4">
            Saya tidak keberatan dan{" "}
            <Box component="span" sx={{ fontWeight: 700 }}>
              bersedia keluar dan mengosongkan sendiri
            </Box>{" "}
            tempat tersebut apabila diperlukan oleh Pemerintah dan{" "}
            <Box component="span" sx={{ fontWeight: 700 }}>
              tidak menuntut ganti rugi
            </Box>{" "}
            apapun pada Perusahaan Umum Daerah Pasar Kota Manado bilamana:
          </StatementItem>
          <Box sx={{ display: "grid", rowGap: "0.8mm", mt: "0.8mm" }}>
            <SubStatementItem marker="a">
              Selama 3 (Tiga){" "}
              <Box component="span" sx={{ fontWeight: 700 }}>
                hari berturut-turut
              </Box>{" "}
              dalam{" "}
              <Box component="span" sx={{ fontWeight: 700 }}>
                bulan berjalan
              </Box>{" "}
              karena satu dan lain hal saya{" "}
              <Box component="span" sx={{ fontWeight: 700 }}>
                menutup usaha
              </Box>{" "}
              sekaligus{" "}
              <Box component="span" sx={{ fontWeight: 700 }}>
                tidak membayar iuran
              </Box>{" "}
              harian pasar dan iuran jasa kebersihan Pasar.
            </SubStatementItem>
            <SubStatementItem marker="b">
              Jika ada penataan dari Pemerintah Kota (PERUMDA Pasar Kota Manado),
              maka saya bersedia mengikuti segala ketentuan/peraturan yang
              ditetapkan oleh Pemerintah Kota (PERUMDA Pasar Kota Manado).
            </SubStatementItem>
          </Box>
        </Box>

        <StatementItem number="5">
          Saya bersedia menyediakan peralatan kebersihan: Tempat Sampah, Sapu Lidi,
          Sapu Ijuk dan lain-lain serta memelihara kebersihan lingkungan tempat
          jualan{" "}
          <Box component="span" sx={{ fontWeight: 700 }}>
            tanpa alasan atas pembayaran iuran jasa kebersihan Pasar
          </Box>
          .
        </StatementItem>

        <StatementItem number="6">
          Apabila di kemudian hari ternyata{" "}
          <Box component="span" sx={{ fontWeight: 700 }}>
            saya tidak menaati pernyataan ini
          </Box>
          , maka{" "}
          <Box component="span" sx={{ fontWeight: 700 }}>
            saya bersedia ditindak
          </Box>{" "}
          oleh PERUMDA Pasar Kota Manado dengan mencabut Izin Lahan ini.
        </StatementItem>
      </Box>

      <Typography sx={{ ...styles.bodyText, mt: "5mm", textAlign: "left" }}>
        Demikian pernyataan ini dibuat untuk dipergunakan seperlunya.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr minmax(55mm, 68mm)",
          mt: "5mm",
          breakInside: "avoid",
          pageBreakInside: "avoid",
        }}
      >
        <Box />
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ ...styles.bodyText, textAlign: "center" }}>
            Manado, {printedDate}
          </Typography>
          <Box sx={{ height: "18mm" }} />
        </Box>
      </Box>

      <Box
        sx={{
          mt: "3mm",
          breakInside: "avoid",
          pageBreakInside: "avoid",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "15mm 3mm minmax(0, 1fr)",
            rowGap: "0.5mm",
          }}
        >
          <Typography sx={{ ...styles.smallText, fontStyle: "italic" }}>
            Keterangan
          </Typography>
          <Box />
          <Box />

          <Typography sx={{ ...styles.smallText, fontStyle: "italic" }}>
            Lembar 1
          </Typography>
          <Typography sx={styles.smallText}>:</Typography>
          <Typography sx={styles.smallText}>Untuk yang bersangkutan</Typography>

          <Typography sx={{ ...styles.smallText, fontStyle: "italic" }}>
            Lembar 2
          </Typography>
          <Typography sx={styles.smallText}>:</Typography>
          <Typography sx={styles.smallText}>Untuk PERUMDA Pasar Manado</Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "15mm 3mm minmax(0, 1fr)",
            mt: "3mm",
          }}
        >
          <Typography sx={{ ...styles.smallText, fontStyle: "italic" }}>
            Catatan
          </Typography>
          <Box />
          <Box />
        </Box>
        <Typography sx={{ ...styles.smallText, fontStyle: "italic" }}>
          (*) Coret yang tidak perlu.
        </Typography>
      </Box>
    </Box>
  );
});

SuratPernyataanIzinLahan.displayName = "SuratPernyataanIzinLahan";

export default SuratPernyataanIzinLahan;
