"use client";
import { useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Grid,
  Divider,
  useTheme,
} from "@mui/material";
import { theme } from "antd";
import { Icon } from "@iconify/react";

const ImportData = () => {
  const theme = useTheme();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [switchButton, setSwitchButton] = useState("backup");

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage("");
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Silakan pilih file terlebih dahulu!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("/api/settings/import-data", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        },
      });

      setMessage(
        `✅ Upload berhasil: ${response.data.file || "berhasil diproses."}`
      );
    } catch (error) {
      console.error(error);
      setMessage("❌ Upload gagal, periksa koneksi atau server backend!");
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: "100%", p: 2 }}>
      <Paper elevation={3}>
        <Grid container>
          <Grid container size={12}>
            <Grid size={6}>
              <Button
                fullWidth
                variant={switchButton === "backup" ? "contained" : "outlined"}
                color="primary"
                onClick={() => setSwitchButton("backup")}
                sx={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  textTransform: "capitalize",
                  borderRadius: "0px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "5px",
                  width: "100%",
                  height: "100%",
                  py: 1,
                }}
              >
                <Icon
                  icon="iconoir:database-backup"
                  fontSize="22px"
                  fontWeight="bold"
                  // color={theme.palette.primary.main}
                />
                Backup Data
              </Button>
            </Grid>

            <Grid size={6}>
              <Button
                fullWidth
                variant={switchButton === "restore" ? "contained" : "outlined"}
                color="primary"
                onClick={() => setSwitchButton("restore")}
                sx={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  textTransform: "capitalize",
                  borderRadius: "0px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "5px",
                  width: "100%",
                  height: "100%",
                  py: 1,
                }}
              >
                <Icon
                  icon="iconoir:database-restore"
                  fontSize="22px"
                  fontWeight="bold"
                  // color={theme.palette.primary.main}
                />
                Restore Data
              </Button>
            </Grid>
          </Grid>
          <Grid size={12}>
            <Typography variant="h5" gutterBottom>
              Upload File Master Data
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Format file: Excel (.xlsx atau .xls)
            </Typography>

            <Stack spacing={2} sx={{ mt: 3, alignItems: "center" }}>
              <Button variant="contained" component="label">
                Pilih File
                <input type="file" hidden onChange={handleFileChange} />
              </Button>

              {selectedFile && (
                <Box>
                  <Typography variant="subtitle1">
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={!selectedFile}
              >
                Upload
              </Button>

              {uploadProgress > 0 && (
                <Box sx={{ width: "100%", mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {uploadProgress}%
                  </Typography>
                </Box>
              )}

              {message && (
                <Typography
                  variant="body1"
                  color={
                    message.includes("berhasil") ? "success.main" : "error.main"
                  }
                  sx={{ mt: 2 }}
                >
                  {message}
                </Typography>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Upload File Master Data
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Format file: Excel (.xlsx atau .xls)
        </Typography>

        <Stack spacing={2} sx={{ mt: 3, alignItems: "center" }}>
          <Button variant="contained" component="label">
            Pilih File
            <input type="file" hidden onChange={handleFileChange} />
          </Button>

          {selectedFile && (
            <Box>
              <Typography variant="subtitle1">{selectedFile.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!selectedFile}
          >
            Upload
          </Button>

          {uploadProgress > 0 && (
            <Box sx={{ width: "100%", mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {uploadProgress}%
              </Typography>
            </Box>
          )}

          {message && (
            <Typography
              variant="body1"
              color={
                message.includes("berhasil") ? "success.main" : "error.main"
              }
              sx={{ mt: 2 }}
            >
              {message}
            </Typography>
          )}
        </Stack>
      </Paper> */}
    </Box>
  );
};

export default ImportData;
