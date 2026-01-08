import {
  Autocomplete,
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
import { updateUserCookie } from "@/app/utils/updateUserCookie";

const EditUser = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getUsersData,
  onNotify,
  selectedData,
  user,
  setUser,
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

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (open) {
      setFullName(selectedData.full_name);
      setUsername(selectedData.username);
      setPhone(selectedData.phone);
      setEmail(selectedData.email);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();
    try {
      const response = await axios.put(
        `/api/account/update-user/${selectedData.id}`,
        {
          fullName,
          username,
          phone,
          email,
        }
      );
      // console.log('response edit user', response);

      if (response.data.success) {
        // Notifikasi sukses
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "User berhasil diubah!",
            severity: "success",
          });

        // UPDATE COOKIE JIKA YANG DI-EDIT ADALAH USER YANG SEDANG LOGIN
        if (user && user?.id === selectedData.id) {
          const updatedUser = updateUserCookie({
            full_name: fullName,
            username,
            email,
          });

          // trigger re-render navbar
          if (updatedUser) {
            setUser(updatedUser);
          }
        }

        await getUsersData();
        setTimeout(() => {
          loadingFalse();
          onClose();
        }, 1000);
      } else {
        // Notifikasi error
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Gagal mengubah User.",
            severity: "error",
          });
      }
    } catch (error) {
      console.log("error", error);
      onNotify &&
        onNotify({
          open: true,
          message:
            error?.response?.data?.message || "Terjadi error saat mengubah User.",
          severity: "error",
        });
    }
    setTimeout(() => {
      loadingFalse();
    }, 1000);
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
            mb: 5,
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{ fontWeight: "bold", textAlign: "center" }}
          >
            Form Ubah Informasi Akun
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={isMobile ? 3 : 2}>
            <Grid size={12}>
              <TextField
                label="Nama Lengkap"
                variant="filled"
                fullWidth
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="No. Telepon"
                placeholder="082xxxxx"
                variant="filled"
                fullWidth
                value={phone}
                onChange={(e) => {
                  // tanpa spasi dan hanya angka
                  setPhone(
                    e.target.value.replace(/\s/g, "").replace(/[^0-9]/g, "")
                  );
                }}
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Email"
                placeholder="john@example.com"
                variant="filled"
                fullWidth
                value={email}
                onChange={(e) => {
                  // tanpa spasi dan hanya angka
                  setEmail(e.target.value);
                }}
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
                {loading ? "Mengirim..." : "Submit Data"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Modal>
  );
};

export default EditUser;
