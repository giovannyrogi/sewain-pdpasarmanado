import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";

const EditCategory = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getDataCategory,
  onNotify,
  selectedData,
  location_id,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const theme = useTheme();

  const style = {
    width: isMobile ? "90vw" : 400,
    maxWidth: "98vw",
    bgcolor: "background.paper",
    color: "text.primary",
    borderRadius: "10px",
    boxShadow: 24,
    p: "18px 20px 18px 20px",
    maxHeight: "90vh",
    overflowY: "auto",
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open && selectedData) {
      setName(selectedData.name);
      setDescription(selectedData.description);
    }
  }, [open, selectedData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();

    try {
      const response = await axios.put(`/api/category/${selectedData.id}`, {
        name,
        description,
        location_id,
      });
      if (response.data.success) {
        // Notifikasi sukses
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Category berhasil diubah!",
            severity: "success",
          });
        setTimeout(() => {
          getDataCategory();
          onClose();
          loadingFalse();
        }, 1000);
      } else {
        // Notifikasi error
        setTimeout(() => {
          onNotify &&
            onNotify({
              open: true,
              message: response.data.message || "Gagal mengubah category.",
              severity: "error",
            });
          loadingFalse();
        }, 1000);
      }
    } catch (error) {
      console.log("error", error);
      setTimeout(() => {
        onNotify &&
          onNotify({
            open: true,
            message:
              error.response.data.message ||
              "Terjadi error saat mengubah category.",
            severity: "error",
          });
        loadingFalse();
      }, 1000);
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
      <Box sx={style}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
            Edit Data Category
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                label="Nama"
                variant="filled"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Username"
                variant="filled"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{
                  mt: 2,
                  fontWeight: "bold",
                  fontSize: 16,
                  textTransform: "none",
                }}
                disabled={loading}
                startIcon={
                  loading && <CircularProgress size={22} color="inherit" />
                }
              >
                {loading ? "Mengirim..." : "Ubah Data"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Modal>
  );
};

export default EditCategory;
