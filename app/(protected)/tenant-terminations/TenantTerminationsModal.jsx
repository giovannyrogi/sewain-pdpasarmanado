"use client";
import {
  Box,
  Button,
  CircularProgress,
  Modal,
  Typography,
  useMediaQuery,
  useTheme,
  Fade,
  Grid,
  TextField,
  IconButton,
  Autocomplete,
  Divider,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import ImagePreviewModal from "@/app/components/modals/ImagePreviewModal";
import TenantApplicationDetailModal from "@/app/components/modals/TenantApplicationDetailModal";

const TenantTerminationsModal = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  onNotify,
  getDataTenantTerminations,
  user,
}) => {
  const { themeMode } = useThemeMode();
  const isMobile = useMediaQuery("(max-width:600px)");
  const theme = useTheme();
  const [notes, setNotes] = useState("");
  const [suratPernyataanFilePath, setSuratPernyataanFilePath] = useState("");
  const [suratPernyataanFile, setSuratPernyataanFile] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [dataTenantApplication, setDataTenantApplication] = useState([]);
  const [tenantApplicationId, setTenantApplicationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDetailTenant, setOpenDetailTenant] = useState(false);
  const [selectedData, setSelectedData] = useState("");

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: isMobile ? "90vw" : 420,
    bgcolor: "background.paper",
    color: "text.primary",
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    p: isMobile ? 2 : "28px 32px",
    outline: "none",
  };

  const getDataTenantApplication = async () => {
    loadingTrue();
    try {
      const response = await axios.get(
        "/api/tenant-application/without-terminations"
      );
      // console.log("tenant application", response);
      setDataTenantApplication(response.data.data);
      setTimeout(() => {
        loadingFalse();
      }, 1000);
    } catch (error) {
      console.log("error", error);
      setTimeout(() => {
        loadingFalse();
      }, 1000);
    }
  };

  useEffect(() => {
    if (open) {
      getDataTenantApplication();
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();
    setIsSubmitting(true);

    if (!suratPernyataanFile) {
      onNotify &&
        onNotify({
          open: true,
          message: "Silakan upload surat pernyataan!",
          severity: "error",
        });
      loadingFalse();
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("tenant_application_id", tenantApplicationId);
    formData.append("reason", notes);
    formData.append("processed_by", user?.id);
    formData.append("statement_file", suratPernyataanFile);

    try {
      const response = await axios.post("/api/tenant-terminations", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // console.log("response", response);
      if (response.data.success) {
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message,
            severity: "success",
          });
        getDataTenantTerminations();
        setTimeout(() => {
          clearForm();
          onClose();
          loadingFalse();
          setIsSubmitting(false);
        }, 1000);
      }
    } catch (error) {
      console.log("error", error);
      onNotify &&
        onNotify({
          open: true,
          message: error?.response?.data?.message,
          severity: "error",
        });
      setTimeout(() => {
        onClose();
        loadingFalse();
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const handlepChangeDocument = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        // 1MB = 1024*1024 bytes
        onNotify &&
          onNotify({
            open: true,
            message:
              "Ukuran file maksimal 1MB. Silakan pilih file yang lebih kecil.",
            severity: "error",
          });
        // Reset input file agar user bisa pilih ulang
        e.target.value = "";
        return;
      }
      setSuratPernyataanFile(file);
      // generate URL sementara untuk preview / download
      const tempUrl = URL.createObjectURL(file);
      setSuratPernyataanFilePath(tempUrl);
    }
  };

  const clearForm = () => {
    setNotes("");
    setSuratPernyataanFilePath("");
    setSuratPernyataanFile(null);
    setTenantApplicationId("");
    setDataTenantApplication([]);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(30,30,30,0.25)",
          backdropFilter: "blur(6px)",
        },
      }}
    >
      <Fade in={open}>
        <Box sx={style}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ textAlign: "center", color: theme.palette.primary.main }}
          >
            Non-Aktifkan Tenant
          </Typography>

          <Divider
            sx={{
              mb: 4,
              borderColor: theme.palette.primary.main,
            }}
          />

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Autocomplete
                  options={dataTenantApplication || []}
                  getOptionLabel={(option) =>
                    option.tenant_name
                      ? option.tenant_name +
                        " - " +
                        option.location_name +
                        " - " +
                        option.room_number
                      : ""
                  }
                  value={
                    dataTenantApplication
                      ? dataTenantApplication.find(
                          (item) =>
                            item.tenant_application_id === tenantApplicationId
                        ) || null
                      : null
                  }
                  onChange={(event, newValue) => {
                    const selectedTenantApplicationId = newValue
                      ? newValue.tenant_application_id
                      : "";
                    setSelectedData(newValue);
                    setTenantApplicationId(selectedTenantApplicationId);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pilih Kontrak"
                      variant="filled"
                      required
                    />
                  )}
                />
              </Grid>
              {tenantApplicationId && (
                <Grid container size={12}>
                  <Grid
                    size={isMobile ? 12 : 6}
                    sx={{
                      mt: isMobile ? -1.5 : -2,
                      mb: isMobile ? -2 : -5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        fontSize: "12px",
                        cursor: "pointer",
                        color: theme.palette.primary.main,
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                      onClick={() => setOpenDetailTenant(true)}
                    >
                      Lihat Detail Tenant
                    </Typography>
                  </Grid>
                </Grid>
              )}
              <Grid size={12}>
                <TextField
                  label="Alasan Menonaktifkan"
                  placeholder="Tuliskan alasan menonaktifkan..."
                  fullWidth
                  variant="filled"
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 150))}
                  inputProps={{ maxLength: 150 }}
                  required
                />
                <Typography variant="caption" sx={{ float: "right", mt: 0.5 }}>
                  {notes.length}/150
                </Typography>
              </Grid>
              <Grid
                size={12}
                sx={{
                  border: `1px solid ${theme.palette.primary.main}`,
                  borderRadius: 2,
                }}
              >
                {suratPernyataanFilePath ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 0.8,
                    }}
                  >
                    {/* tombol lihat */}
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        fontSize: "12px",
                        cursor: "pointer",
                        color: theme.palette.primary.main,
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                      // langsung buka file di tab baru
                      onClick={() =>
                        window.open(suratPernyataanFilePath, "_blank")
                      }
                    >
                      Lihat Surat Pernyataan
                    </Typography>

                    {/* tombol hapus */}
                    <IconButton
                      size="small"
                      variant={themeMode === "dark" ? "outlined" : "contained"}
                      color="error"
                      sx={{ minWidth: 0, p: 0 }}
                      onClick={() => {
                        setSuratPernyataanFile(null);
                        setSuratPernyataanFilePath("");
                      }}
                    >
                      <Icon icon="line-md:trash" fontSize={18} color="error" />
                    </IconButton>
                  </Box>
                ) : (
                  // upload file
                  <Button
                    variant="text"
                    component="label"
                    color="primary"
                    fullWidth
                    sx={{
                      textTransform: "none",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontWeight: "bold",
                    }}
                    disabled={loading}
                  >
                    <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
                      Upload Surat Pernyataan
                    </Typography>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      hidden
                      onChange={handlepChangeDocument}
                      disabled={loading}
                    />
                  </Button>
                )}
              </Grid>

              <Grid size={12} mt={1}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="small"
                  sx={{
                    mt: 1,
                    fontWeight: 700,
                    fontSize: 17,
                    textTransform: "none",
                    color: "#fff",
                    bgcolor: "error.main",
                    boxShadow: "0 2px 8px rgba(255,0,0,0.15)",
                    borderRadius: 2,
                    "&:hover": {
                      bgcolor: "error.dark",
                      boxShadow: "0 4px 16px rgba(255,0,0,0.25)",
                    },
                  }}
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : null
                  }
                >
                  {isSubmitting ? "Memproses..." : "Non-Aktifkan"}
                </Button>
              </Grid>
            </Grid>
          </form>
          <TenantApplicationDetailModal
            open={openDetailTenant}
            onClose={() => setOpenDetailTenant(false)}
            selectedData={selectedData}
          />
          {/* Modal Preview Gambar */}
          <ImagePreviewModal
            open={openPreview}
            onClose={() => setOpenPreview(false)}
            imageUrl={suratPernyataanFilePath}
            alt="Preview KTP"
          />
        </Box>
      </Fade>
    </Modal>
  );
};

export default TenantTerminationsModal;
