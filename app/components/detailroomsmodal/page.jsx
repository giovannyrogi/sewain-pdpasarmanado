"use client";

import {
  Box,
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
import moment from "moment";
import formatRupiah from "../formatrupiah/page";
import { formatNumber } from "@/app/utils/formatNumber";

const DetailRoomsModal = ({
  open,
  onClose,
  loading,
  loadingTrue,
  loadingFalse,
  setLoadingMessage,
  selectedDataRooms,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const theme = useTheme();
  const [approvalList, setApprovalList] = useState([]);
  const [openPreview, setOpenPreview] = useState(false);

  // console.log('selectedDataRooms di DetailRoomsModal:', selectedDataRooms);

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
    //hide scrollbar
    "&::-webkit-scrollbar": {
      display: "none",
    },
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
          <Typography
            sx={{
              fontSize: isMobile ? 18 : 20,
              fontWeight: "bold",
              mb: isMobile ? 0.5 : undefined,
            }}
          >
            Detail Informasi Ruangan
          </Typography>

          <Divider sx={{ mb: 1, borderColor: theme.palette.primary.main }} />

          <Grid container size={isMobile ? 12 : 6} spacing={2}>
            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Nomor Ruangan
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
                No.{" "}
                {selectedDataRooms?.room_number
                  ? selectedDataRooms.room_number
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
                {selectedDataRooms?.floor ? selectedDataRooms.floor : "-"}
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
                Panjang Ruangan (m)
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
                {selectedDataRooms?.room_length
                  ? formatNumber(selectedDataRooms.room_length)
                  : "-"}{" "}
                m
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
                Lebar Ruangan (m)
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
                {selectedDataRooms?.room_width
                  ? formatNumber(selectedDataRooms.room_width)
                  : "-"}{" "}
                m
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
                Luas Ruangan (m)
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
                {selectedDataRooms?.room_area
                  ? formatNumber(selectedDataRooms.room_area)
                  : "-"}{" "}
                m²
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
                Harga Sewa Ruangan (m)
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
                {selectedDataRooms?.price_per_m2
                  ? formatRupiah(selectedDataRooms.price_per_m2)
                  : "-"}
              </Typography>
            </Grid>
            {selectedDataRooms?.price_type === "harga_per_meter" && (
              <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: theme.palette.primary.main,
                  }}
                >
                  Total Harga Sewa
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
                  {selectedDataRooms?.price_per_m2
                    ? formatRupiah(
                        selectedDataRooms.price_per_m2 *
                          selectedDataRooms.room_area,
                      )
                    : "-"}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </Fade>
    </Modal>
  );
};

export default DetailRoomsModal;
