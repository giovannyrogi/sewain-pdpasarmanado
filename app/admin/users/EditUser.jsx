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

const EditUser = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getUsersData,
  onNotify,
  dataLocations,
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (open && selectedData) {
      setName(selectedData.name);
      setUsername(selectedData.username);
      setPassword(selectedData.password);
      setRole(selectedData.role);
      setPhone(selectedData.phone);
      setEmail(selectedData.email);
    }
  }, [open, selectedData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();

    try {
      const response = await axios.put(`/api/users/${selectedData.id}`, {
        name,
        username,
        password,
        role,
        phone,
        location_id,
        email,
      });
      if (response.data.success) {
        // Notifikasi sukses
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "User berhasil diubah!",
            severity: "success",
          });

        setTimeout(() => {
          getUsersData();
          onClose();
          loadingFalse();
        }, 1000);
      } else {
        // Notifikasi error
        setTimeout(() => {
          onNotify &&
            onNotify({
              open: true,
              message: response.data.message || "Gagal mengubah User.",
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
            message: error.response.data.message || "Terjadi error saat mengubah User.",
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
            Edit Data User
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
            <Grid size={isMobile ? 12 : 6}>
              <TextField
                label="Username"
                variant="filled"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={isMobile ? 12 : 6}>
              <TextField
                label="Password"
                variant="filled"
                fullWidth
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                color="primary"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPass(!showPass)}
                        edge="end"
                        disabled={loading}
                      >
                        {showPass ? (
                          <Icon
                            icon="line-md:watch-twotone-loop"
                            style={{ color: theme.palette.primary.main }}
                            fontSize={25}
                          />
                        ) : (
                          <Icon
                            icon="line-md:watch-off-loop"
                            style={{ color: theme.palette.primary.main }}
                            fontSize={25}
                          />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={12}>
              {" "}
              <FormControl fullWidth variant="filled" required>
                <InputLabel id="demo-simple-select-filled-label">
                  Pilih Role
                </InputLabel>
                <Select value={role} onChange={(e) => setRole(e.target.value)}>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="jukir">Jukir</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={isMobile ? 12 : 6}>
              <TextField
                label="No Telpon"
                variant="filled"
                fullWidth
                value={phone}
                onChange={(e) => {
                  // Hanya izinkan angka
                  const onlyNums = e.target.value.replace(/[^0-9]/g, "");
                  setPhone(onlyNums);
                }}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={isMobile ? 12 : 6}>
              <TextField
                label="Email"
                variant="filled"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

export default EditUser;
