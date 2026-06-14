"use client";
import {
  Box,
  Typography,
} from "@mui/material";
import React, { forwardRef } from "react";
import Image from "next/image";
import { getUploadApiUrl } from "@/app/utils/uploadPath";

const FotoKTP = forwardRef(({ data }, ref) => {
  if (!data) return null;
  const ktpImageUrl = getUploadApiUrl(data?.ktp_file_path);
  const hasKtpImage = Boolean(ktpImageUrl);

  return (
    <Box
      ref={ref}
      sx={{
        padding: "10px 30px 0px 30px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 500,
          height: 500,
          aspectRatio: "16/9",
          position: "relative",
          mt: 10,
        }}
      >
        {hasKtpImage ? (
          <Image
            src={ktpImageUrl}
            alt={`foto-ktp-${data?.tenant_name || "penyewa"}`}
            fill
            style={{ objectFit: "contain", borderRadius: "8px" }}
            priority
            unoptimized
          />
        ) : (
          <Box
            sx={{
              height: "100%",
              border: "1px dashed #9ca3af",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 3,
            }}
          >
            <Typography
              sx={{
                fontFamily: "calibri",
                fontSize: "12pt",
                fontWeight: 700,
                color: "#4b5563",
              }}
            >
              Foto KTP tidak tersedia
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
});

export default FotoKTP;
