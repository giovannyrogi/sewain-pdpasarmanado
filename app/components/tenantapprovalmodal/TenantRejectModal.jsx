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
} from "@mui/material";
import React, { useState } from "react";
import axios from "axios";

const TenantRejectModal = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  onNotify,
  selectedData,
  getDataApprovals,
  user
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const theme = useTheme();
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();
    try {
      const response = await axios.put(
        `/api/tenant-approval/tenant-rejected/${selectedData.id}`,
        {
          notes,
          status: "rejected",
          tenant_application_id: selectedData.tenant_application_id,
          approver_id: user.id,
        }
      );

      if (response?.data.success) {
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Berhasil Menolak Sewa Ruangan!",
            severity: "error",
          });
        getDataApprovals();
        setTimeout(() => {
          onClose();
          setNotes("");
          loadingFalse();
        }, 1000);
      } else {
        onNotify &&
          onNotify({
            open: true,
            message: response?.data.message || "Gagal Menolak Sewa Ruangan.",
            severity: "error",
          });
        setTimeout(() => {
          loadingFalse();
        }, 1000);
      }
    } catch (error) {
      console.error("Error rejecting tenant approval:", error);
      onNotify &&
        onNotify({
          open: true,
          message:
            error?.response?.data?.message || "Gagal Menolak Sewa Ruangan.",
          severity: "error",
        });
      setTimeout(() => {
        loadingFalse();
      }, 1000);
    }
  };

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
            mb={4}
            sx={{ textAlign: "center", color: theme.palette.primary.main }}
          >
            Tolak Permohonan Sewa Ruangan
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  label="Alasan Penolakan"
                  placeholder="Tuliskan alasan menolak..."
                  fullWidth
                  variant="filled"
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 100))}
                  inputProps={{ maxLength: 100 }}
                  required
                />
                <Typography variant="caption" sx={{ float: "right", mt: 0.5 }}>
                  {notes.length}/100
                </Typography>
              </Grid>

              <Grid size={12}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
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
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : null
                  }
                >
                  {loading ? "Memproses..." : "Tolak Permohonan"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Fade>
    </Modal>
  );
};

export default TenantRejectModal;
