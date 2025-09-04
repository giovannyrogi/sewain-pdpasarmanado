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

const AddDevice = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getDataDevice,
  onNotify,
  location_id,
  dataUsersWithoutDeviceId,
  getDataUsersWithoutDeviceId,
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

  const [deviceName, setDeviceName] = useState("");
  const [deviceCode, setDeviceCode] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();

    try {
      const response = await axios.post("/api/devices", {
        name,
        description,
        location_id,
      });
      if (response.data.success) {
        // Notifikasi sukses
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Devices berhasil ditambahkan!",
            severity: "success",
          });

        setTimeout(() => {
          getDataDevice();
          onClose();
          loadingFalse();
          clearForm();
        }, 1000);
      } else {
        // Notifikasi error
        setTimeout(() => {
          onNotify &&
            onNotify({
              open: true,
              message: response.data.message || "Gagal menambah device.",
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
              "Terjadi error saat menambah device.",
            severity: "error",
          });
        loadingFalse();
      }, 1000);
    }
  };

  const clearForm = () => {
    setDeviceName("");
    setDeviceCode("");
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        clearForm();
      }}
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
            Tambah Device
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                label="Nama Device"
                variant="filled"
                fullWidth
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Kode Device"
                variant="filled"
                fullWidth
                value={deviceCode}
                onChange={(e) => setDeviceCode(e.target.value)}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth variant="filled" required>
                <InputLabel id="demo-simple-select-filled-label">
                  Pilih User
                </InputLabel>
                <Select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <MenuItem value="admin">
                    {dataUsersWithoutDeviceId && dataUsersWithoutDeviceId.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid size={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                mt: 3,
                fontWeight: "bold",
                fontSize: 16,
                textTransform: "none",
              }}
              disabled={loading}
              startIcon={
                loading && <CircularProgress size={22} color="inherit" />
              }
            >
              {loading ? "Mengirim..." : "Buat Category"}
            </Button>
          </Grid>
        </form>
      </Box>
    </Modal>
  );
};

export default AddDevice;
