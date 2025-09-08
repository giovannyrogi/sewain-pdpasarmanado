"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
  useMediaQuery,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { useThemeMode } from "../components/themeprovider/ThemeContext";
import Notification from "../components/Notification";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "../components/loading/Backdrop";
import axios from "axios";
import Image from "next/image";

export default function LoginPage() {
  const isMobile = useMediaQuery("(max-width:600px)");
  const router = useRouter();
  const { themeMode, setThemeMode } = useThemeMode();
  const theme = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false); // loading saat klik login
  const [redirecting, setRedirecting] = useState(false); // loading saat pindah page
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/login", { username, password });
      setSnackbar({
        open: true,
        message: "Login berhasil!",
        severity: "success",
      });

      // middleware akan handle redirect berdasarkan role
      setTimeout(() => {
        router.refresh(); // reload server component → middleware dijalankan
      }, 1000);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Login gagal!",
        severity: "error",
      });
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: "background.default",
        color: "text.primary",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        transition: "all 0.3s",
        padding: isMobile ? 3 : 0,
        // Tambahkan background image sesuai themeMode
        // backgroundImage: `url(${
        //   themeMode === "dark"
        //     ? "/login-bg-darkmode.png"
        //     : "/login-bg-lightmode.png"
        // })`,
        // backgroundSize: "cover",
        // backgroundPosition: "center",
        // backgroundRepeat: "no-repeat",
      }}
    >
      {/* Spinner full screen saat redirect */}
      <LoadingBackdrop
        open={redirecting}
        message="Redirecting..."
        color="#fff"
      />

      <Paper
        elevation={6}
        sx={{
          p: isMobile ? 3 : 5,
          width: "100%",
          maxWidth: 400,
          borderRadius: 3,
          bgcolor: "background.default",
          boxShadow: 4,
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          {/* <Typography variant="h5" fontWeight="bold">
            Login
          </Typography> */}
          <Image
            src="/logo-pdpasar.png"
            alt="logo-pdpasar"
            width={50}
            height={50}
            // style={{backgroundColor:'orange'}}
          />

          <IconButton
            onClick={() => {
              setThemeMode(themeMode === "dark" ? "light" : "dark");
              localStorage.setItem(
                "currentTheme",
                JSON.stringify({
                  currentThemeMode: themeMode === "dark" ? "light" : "dark",
                })
              );
            }}
            color="primary"
            aria-label="toggle theme"
          >
            {themeMode === "dark" ? (
              <Icon
                icon="line-md:sunny-filled-loop-to-moon-filled-loop-transition"
                fontSize="25px"
              />
            ) : (
              <Icon
                icon="line-md:moon-filled-alt-to-sunny-filled-loop-transition"
                fontSize="25px"
              />
            )}
          </IconButton>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            mb: 2,
          }}
        >
          {/* <Image
            src="/logo-pdpasar.png"
            alt="logo-pdpasar"
            width={100}
            height={100}
          /> */}
          <Image
            src={
              themeMode === "dark"
                ? "/logo-darkmode.png"
                : "/logo-lightmode.png"
            }
            alt="logo-pdpasar"
            width={200}
            height={80}
            // style={{backgroundColor:'orange'}}
          />
          {/* <Typography
            sx={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "primary.main",
            }}
          >
            Parumda Pasar Manado
          </Typography> */}
        </Box>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <TextField
            label="Username"
            variant="filled"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
            disabled={loading || redirecting}
            color="primary"
          />
          <TextField
            label="Password"
            variant="filled"
            fullWidth
            margin="normal"
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || redirecting}
            color="primary"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPass(!showPass)}
                    edge="end"
                    disabled={loading || redirecting}
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
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, fontWeight: "bold", fontSize: 16 }}
            disabled={loading || redirecting}
            startIcon={
              loading && <CircularProgress size={22} color="inherit" />
            }
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Paper>

      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          py: 1,
          bgcolor: "transparent",
          zIndex: 1300, // pastikan di atas konten lain jika perlu
          textAlign: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          Copyright &copy; {new Date().getFullYear()} - Perumda Pasar Manado
        </Typography>
      </Box>

      {/* Snackbar notification */}
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
}
