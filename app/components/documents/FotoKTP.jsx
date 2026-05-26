"use client";
import {
  Box,
  Typography,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Grid,
} from "@mui/material";
import moment from "moment";
import React, { forwardRef } from "react";
import formatRupiah from "../formatrupiah/page";
import Image from "next/image";
import { getUploadApiUrl } from "@/app/utils/uploadPath";

const FotoKTP = forwardRef(({ data }, ref) => {
  if (!data) return null;
  const ktpImageUrl = getUploadApiUrl(data?.ktp_file_path);

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
        <Image
          src={ktpImageUrl}
          alt={`foto-ktp-${data?.tenant_name}`}
          fill
          style={{ objectFit: "contain", borderRadius: "8px" }}
          priority
        />
      </Box>
    </Box>
  );
});

export default FotoKTP;
