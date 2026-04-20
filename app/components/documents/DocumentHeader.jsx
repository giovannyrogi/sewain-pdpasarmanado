import { Box, Typography, Divider } from "@mui/material";
import Image from "next/image";

const DocumentHeader = () => {
  return (
    <Box sx={{ width: "100%", mb: 1 }}>
      {/* HEADER UTAMA */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          columnGap: 2,
        }}
      >
        {/* LOGO KIRI */}
        <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
          <Image
            src="/logo-pemerintah-kota-manado.png"
            alt="logo kiri"
            width={110}
            height={90}
            priority
          />
        </Box>

        {/* JUDUL TENGAH */}
        <Box
          sx={{
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          <Typography
            sx={{
              fontSize: "22pt",
              fontWeight: "bold",
              fontFamily: "Bernard MT Condensed bold",
              mb: -1,
            }}
          >
            PERUSAHAAN UMUM DAERAH
          </Typography>

          <Typography
            sx={{
              fontSize: "22pt",
              fontWeight: "bold",
              fontFamily: "Bernard MT Condensed bold",
            }}
          >
            PASAR MANADO
          </Typography>

          {/* ALAMAT (PAKSA 1 BARIS) */}
          <Typography
            sx={{
              fontSize: "7pt",
              fontFamily: "agency fb regular",
              whiteSpace: "nowrap", // 🔥 penting
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Kompleks Gedung Shoping Center Lt. II Manado, Jl. Walanda Maramis No. 123, Kel. Pinaesaan, Kec. Wenang Kota Manado
          </Typography>
        </Box>

        {/* LOGO KANAN */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Image
            src="/logo-perumda-pasar-manado.png"
            alt="logo kanan"
            width={90}
            height={90}
            priority
          />
        </Box>
      </Box>

      {/* GARIS PEMBATAS (MASUK HEADER) */}
      <Box sx={{ mt: 0.5 }}>
        <Divider sx={{ borderColor: "black", mb: "2px" }} />
        <Divider sx={{ borderWidth: "1px", borderColor: "black" }} />
      </Box>
    </Box>
  );
};

export default DocumentHeader;