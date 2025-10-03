"use client";

import {
  Box,
  Button,
  CircularProgress,
  Modal,
  Typography,
  useMediaQuery,
  Fade,
  Divider,
  Grid,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import ImagePreviewModal from "../imagepreviewmodal/page";
import moment from "moment";

const InformationPreviewModal = ({ open, onClose, selectedData }) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  const [openPreview, setOpenPreview] = useState(false);

  //   console.log("selectedData", selectedData);
  const theme = useTheme();

  const style = {
    width: isMobile ? "90vw" : 500,
    maxWidth: "98vw",
    bgcolor: "background.paper",
    color: "text.primary",
    borderRadius: "10px",
    boxShadow: 24,
    p: "18px 20px 18px 20px",
    maxHeight: "90vh",
    overflowY: "auto",
    transition: "box-shadow 0.3s",
    //hide scrollbar
    "&::-webkit-scrollbar": {
      display: "none",
    },
    position: "relative",
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 0, // hilangkan padding default
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(30,30,30,0.25)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        },
      }}
    >
      <Fade in={open}>
        <Box sx={style}>
          <Box>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: "bold",
                // color: theme.palette.primary.main,
              }}
            >
              Informasi Identitas Penyewa
            </Typography>
          </Box>

          <Divider
            sx={{
              mb: 2,
              borderColor: theme.palette.primary.main,
            }}
          />

          <Grid container spacing={2}>
            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Nama Lengkap
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.full_name ? selectedData.full_name : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                NIK
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.nik ? selectedData.nik : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Tempat, Tanggal Lahir
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.birth_place},{" "}
                {moment(selectedData?.birth_date).format("D MMMM YYYY")}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Pekerjaan
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.occupation ? selectedData.occupation : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Agama
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.religion ? selectedData.religion : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Agama
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.religion ? selectedData.religion : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Nomor Telepon
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.phone ? selectedData.phone : "-"}
              </Typography>
            </Grid>
          </Grid>

          <Box>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: "bold",
                // color: theme.palette.primary.main,
                mt: 2,
              }}
            >
              Detail Alamat
            </Typography>
          </Box>

          <Divider
            sx={{
              mb: 2,
              borderColor: theme.palette.primary.main,
            }}
          />

          <Grid container spacing={2}>
            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Provinsi
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.province ? selectedData.province : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Kabupaten/Kota
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.city ? selectedData.city : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Kecamatan
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.district ? selectedData.district : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Kelurahan/Desa
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.kelurahan ? selectedData.kelurahan : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Nama Jalan
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.street_address
                  ? selectedData.street_address
                  : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                RT/RW
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.rt ? selectedData.rt : "000"} /{" "}
                {selectedData?.rw ? selectedData.rw : "000"}
              </Typography>
            </Grid>
          </Grid>

          <Grid container mt={2}>
            <Grid size={12} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  color: theme.palette.primary.main,
                }}
              >
                Foto KTP
              </Typography>

              <Divider
                sx={{
                  borderColor: theme.palette.primary.main,
                  mb: 1,
                }}
              />

              {/* Container dengan tinggi tetap */}
              <Box
                sx={{
                  width: "100%",
                  height: 150, // tinggi konsisten
                  display: "flex",
                  overflow: "hidden",
                  borderRadius: 2,
                  // bgcolor: "#f8f8f8",
                }}
              >
                <img
                  src={
                    selectedData?.ktp_file_path
                      ? selectedData.ktp_file_path
                      : ""
                  }
                  alt="ktp"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain", // biar tetap proporsional
                  }}
                  onClick={() => setOpenPreview(true)}
                />
              </Box>
            </Grid>

            <Grid size={12} mt={3}>
              <Button
                type="submit"
                variant="contained"
                color="error"
                size="small"
                fullWidth
                sx={{
                  fontWeight: "bold",
                  fontSize: 16,
                  textTransform: "none",
                }}
                onClick={onClose}
              >
                Kembali
              </Button>
            </Grid>
          </Grid>

          {/* Modal Preview Gambar */}
          <ImagePreviewModal
            open={openPreview}
            onClose={() => setOpenPreview(false)}
            imageUrl={
              selectedData?.ktp_file_path ? selectedData.ktp_file_path : ""
            }
            alt="Preview KTP"
          />
        </Box>
      </Fade>
    </Modal>
  );
};

export default InformationPreviewModal;
