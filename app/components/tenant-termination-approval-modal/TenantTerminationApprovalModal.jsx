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
import ImagePreviewModal from "../../components/imagepreviewmodal/page";
import formatRupiah from "../../components/formatrupiah/page";
import moment from "moment";
import ApprovedOverlay from "../tenantapprovalmodal/ApprovedOverlay";
import Image from "next/image";

const TenantTerminationApprovalModal = ({
  open,
  onClose,
  selectedData,
  loadingTrue,
  loadingFalse,
  onNotify,
  getDataTenantTerminations,
  user,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  const [openPreview, setOpenPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // console.log("selectedData", selectedData);
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

  const handleSubmit = async () => {
    loadingTrue();
    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `/api/tenant-termination-approval/${selectedData.termination_approval_id}`,
        {
          tenant_early_termination_id: selectedData.tenant_early_termination_id,
          status: "approved", // atau "rejected"
          approver_id: user.id,
          room_id: selectedData.room_id,
          tenant_identity_id: selectedData?.tenant_identity_id,
        }
      );
      console.log("response", response.data);

      if (response.data.success) {
        onNotify?.({
          open: true,
          message: response.data.message || "Berhasil Menyetujui Sewa Ruangan!",
          severity: "success",
        });
        getDataTenantTerminations();
        setTimeout(() => {
          onClose();
          loadingFalse();
          setIsSubmitting(false);
        }, 1000);
      } else {
        onNotify?.({
          open: true,
          message: response.data.message || "Gagal Menyetujui Sewa Ruangan.",
          severity: "error",
        });
        loadingFalse();
        setIsSubmitting(false);
      }
    } catch (error) {
      console.log("error", error);
      onNotify?.({
        open: true,
        message:
          error.response.data.message ||
          "Terjadi error saat menyetujui sewa ruangan.",
        severity: "error",
      });
      loadingFalse();
      setIsSubmitting(false);
    }
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
          {/* Detail Data Pemohon */}
          <Grid container spacing={1}>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: "bold",
                // color: theme.palette.primary.main,
              }}
            >
              Detail Data Pemohon
            </Typography>
          </Grid>

          <Divider
            sx={{
              mb: 1,
              borderColor: theme.palette.primary.main,
            }}
          />

          <Grid container spacing={2}>
            <Grid container size={isMobile ? 12 : 6} spacing={2}>
              <Grid
                size={isMobile ? 6 : 12}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: theme.palette.primary.main,
                  }}
                >
                  Nama Penyewa
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    wordBreak: "break-word", // <-- biar kata panjang pecah
                    whiteSpace: "normal", // <-- biar bisa turun baris
                    overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                  }}
                >
                  {selectedData?.tenant_name ? selectedData.tenant_name : "-"}
                </Typography>
              </Grid>

              <Grid
                size={isMobile ? 6 : 12}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: theme.palette.primary.main,
                  }}
                >
                  NIK
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    wordBreak: "break-word", // <-- biar kata panjang pecah
                    whiteSpace: "normal", // <-- biar bisa turun baris
                    overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                  }}
                >
                  {selectedData?.tenant_nik ? selectedData.tenant_nik : "-"}
                </Typography>
              </Grid>

              <Grid
                size={isMobile ? 6 : 12}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: theme.palette.primary.main,
                  }}
                >
                  Nomor Telepon
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    wordBreak: "break-word", // <-- biar kata panjang pecah
                    whiteSpace: "normal", // <-- biar bisa turun baris
                    overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                  }}
                >
                  {selectedData?.tenant_phone ? selectedData.tenant_phone : "-"}
                </Typography>
              </Grid>
            </Grid>
            <Grid container size={isMobile ? 12 : 6} spacing={2}>
              <Grid size={12} sx={{ display: "flex", flexDirection: "column" }}>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: theme.palette.primary.main,
                  }}
                >
                  Foto KTP
                </Typography>

                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 300, // batas maksimal biar tidak terlalu besar
                    position: "relative",
                    borderRadius: 2,
                    overflow: "hidden",
                    aspectRatio: "16/9", // bentuk rasio KTP (bisa ubah ke 4/3 kalau butuh)
                    mx: "auto",
                  }}
                >
                  {selectedData?.ktp_file_path ? (
                    <Image
                      src={
                        selectedData?.ktp_file_path
                          ? selectedData.ktp_file_path
                          : ""
                      }
                      alt="ktp"
                      fill // penuh mengikuti container
                      style={{
                        objectFit: "contain", // gambar penuh, proporsional
                      }}
                      onClick={() => setOpenPreview(true)}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        bgcolor: "#f8f8f8",
                        color: "#aaa",
                        fontSize: "12px",
                      }}
                    >
                      Tidak ada gambar
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "11px",
                      color: theme.palette.primary.main,
                    }}
                  >
                    Tekan gambar untuk memperbesar
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Detail Lokasi & Ruangan */}
          <Grid container spacing={2} mt={2}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: "bold",
                // color: theme.palette.primary.main,
              }}
            >
              Detail Lokasi & Ruangan
            </Typography>
          </Grid>

          <Divider
            sx={{
              mb: 1,
              borderColor: theme.palette.primary.main,
            }}
          />

          <Grid container spacing={2}>
            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Nama Lokasi
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.location_name ? selectedData.location_name : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Ruangan
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.room_number ? selectedData.room_number : "-"}
              </Typography>
            </Grid>

            {/* <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Lantai
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.floor ? selectedData.floor : "-"}
              </Typography>
            </Grid> */}

            {/* <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Panjang (m)
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.room_length ? selectedData.room_length : "-"} M
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Luas (m)
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.room_area ? selectedData.room_area + " M" : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Lebar (m)
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.room_width ? selectedData.room_width : "-"} M
              </Typography>
            </Grid> */}

            {/* <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Harga Ruangan (m)
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.price_per_m2
                  ? formatRupiah(selectedData.price_per_m2)
                  : "-"}
              </Typography>
            </Grid> */}

            {/* <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Harga Lantai
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.base_price
                  ? formatRupiah(selectedData.base_price)
                  : "-"}
              </Typography>
            </Grid> */}

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Masa Berlaku
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.start_date && selectedData?.end_date
                  ? moment(selectedData.start_date).format("YYYY/MM/DD") +
                    " s/d " +
                    moment(selectedData.end_date).format("YYYY/MM/DD")
                  : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Tanggal Dibuat
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.termination_created_at
                  ? moment(selectedData?.termination_created_at).format(
                      "YYYY/MM/DD"
                    )
                  : "-"}
              </Typography>
            </Grid>
          </Grid>

          {/* Detail Permintaan Non-Aktif */}
          <Grid container spacing={1}>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: "bold",
                // color: theme.palette.primary.main,
                mt: 3,
              }}
            >
              Detail Permintaan Non-Aktif Tenant
            </Typography>
          </Grid>

          <Divider
            sx={{
              mb: 1,
              borderColor: theme.palette.primary.main,
            }}
          />

          <Grid container spacing={1}>
            <Grid
              size={isMobile ? 12 : 6}
              sx={{ display: "flex", flexDirection: "column" }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Surat Pernyataan
              </Typography>

              {selectedData?.statement_file_path ? (
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                    overflowWrap: "anywhere",
                    cursor: "pointer",
                    "&:hover": {
                      textDecoration: "underline",
                      color: "#1976d2",
                    },
                  }}
                  onClick={() =>
                    window.open(selectedData.statement_file_path, "_blank")
                  }
                >
                  Lihat Surat
                </Typography>
              ) : (
                <Typography
                  sx={{
                    fontSize: "13px",
                    color: theme.palette.text.secondary,
                  }}
                >
                  Belum ada surat
                </Typography>
              )}
            </Grid>

            <Grid
              size={isMobile ? 12 : 6}
              sx={{ display: "flex", flexDirection: "column" }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Dibuat Oleh
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.termination_processed_by_full_name
                  ? selectedData.termination_processed_by_full_name
                  : "-"}
              </Typography>
            </Grid>

            <Grid
              size={isMobile ? 12 : 6}
              sx={{ display: "flex", flexDirection: "column" }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Alasan Non-Aktif
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.reason ? selectedData.reason : "-"}
              </Typography>
            </Grid>
          </Grid>

          <Grid
            container
            spacing={1}
            sx={{
              mt: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Grid
              size={
                selectedData?.termination_approval_status === "approved" ||
                selectedData?.termination_approval_status === "rejected"
                  ? 12
                  : 6
              }
            >
              <Button
                type="submit"
                variant="contained"
                color="error"
                size="small"
                sx={{
                  fontWeight: "bold",
                  fontSize: 16,
                  textTransform: "none",
                  width:
                    selectedData?.termination_approval_status === "approved" ||
                    selectedData?.termination_approval_status === "rejected"
                      ? "100%"
                      : 150,
                }}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
            </Grid>
            <Grid size={6} sx={{ textAlign: "right" }}>
              {selectedData?.termination_approval_status === "approved" ||
              selectedData?.termination_approval_status === "rejected" ? (
                ""
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  sx={{
                    fontWeight: "bold",
                    fontSize: 16,
                    textTransform: "none",
                    width: 150,
                    color: "white",
                  }}
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting && (
                      <CircularProgress size={22} color="inherit" />
                    )
                  }
                  onClick={handleSubmit}
                >
                  {isSubmitting ? "Mengirim..." : "Approve"}
                </Button>
              )}
            </Grid>
          </Grid>

          {/* Modal Preview Gambar */}
          <ImagePreviewModal
            open={openPreview}
            onClose={() => setOpenPreview(false)}
            imageUrl={selectedData?.ktp_file_path}
            alt="Preview Pitcure"
          />

          {selectedData?.termination_approval_status === "approved" ||
          selectedData?.termination_approval_status === "rejected" ? (
            <ApprovedOverlay selectedData={selectedData} />
          ) : (
            ""
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default TenantTerminationApprovalModal;
