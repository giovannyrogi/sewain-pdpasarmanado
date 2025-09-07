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
  Avatar,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import ImagePreviewModal from "../imagepreviewmodal/page";

const ApprovalModal = ({
  open,
  onClose,
  selectedData,
  loading,
  loadingTrue,
  loadingFalse,
  setLoadingMessage,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const theme = useTheme();
  const [approvalList, setApprovalList] = useState([]);
  const [openPreview, setOpenPreview] = useState(false);

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: isMobile ? "90vw" : 500,
    maxWidth: "95vw",
    bgcolor: "background.paper",
    color: "text.primary",
    borderRadius: "16px",
    boxShadow: 24,
    p: isMobile ? 2 : "24px 32px",
    outline: "none",
  };

  // Fetch approval list
  const getDataApprovals = async () => {
    setLoadingMessage("Memperbarui data Approval...");
    loadingTrue();
    try {
      const res = await axios.get(`/api/tenant-approval/`, {
        params: { id: selectedData.id },
      });
      console.log("data approval", res);

      if (res.data.success) {
        setApprovalList(res.data.data);
        setTimeout(() => {
          loadingFalse();
        }, 500);
        setTimeout(() => {
          setLoadingMessage("Loading...");
        }, 1000);
      } else {
        console.error("Error fetching tenant approval:", res.data.message);
        setTimeout(() => {
          loadingFalse();
        }, 500);
        setTimeout(() => {
          setLoadingMessage("Loading...");
        }, 1000);
      }
    } catch (err) {
      console.error("Error fetch tenant approval:", err);
      setTimeout(() => {
        loadingFalse();
      }, 500);
      setTimeout(() => {
        setLoadingMessage("Loading...");
      }, 1000);
    }
  };

  useEffect(() => {
    if (open && selectedData?.id) {
      getDataApprovals();
    }
  }, [open, selectedData]);

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
          <Typography sx={{ fontSize: 18, fontWeight: "bold", mb: 1 }}>
            Progress Approval
          </Typography>

          <Divider sx={{ mb: 2, borderColor: theme.palette.primary.main }} />

          <Grid container direction="column" spacing={2}>
            {approvalList.map((item, index) => (
              <Grid item key={item.approval_id}>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={2}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor:
                      item.status === "approved"
                        ? "rgba(76,175,80,0.1)"
                        : "rgba(255,152,0,0.05)",
                  }}
                >
                  {/* Icon / Step Number */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor:
                        item.status === "approved"
                          ? "success.main"
                          : "warning.main",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    {index + 1}
                  </Box>

                  {/* Role and Approver */}
                  <Box flex={1}>
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        fontSize: 15,
                        mb: 0.5,
                      }}
                    >
                      {item.role_name}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
                      {item.status === "approved"
                        ? `Approved by: ${item.full_name}`
                        : "Pending"}
                    </Typography>
                  </Box>

                  {/* Status Icon */}
                  <Box>
                    {item.status === "approved" ? (
                      <Icon
                        icon="ph:seal-check-duotone"
                        color={theme.palette.success.main}
                        width={40}
                        height={40}
                      />
                    ) : (
                      <Icon
                        icon="svg-spinners:6-dots-scale-middle"
                        color={theme.palette.warning.main}
                        width={40}
                        height={40}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Modal Preview Gambar */}
          <ImagePreviewModal
            open={openPreview}
            onClose={() => setOpenPreview(false)}
            imageUrl={selectedData?.ktp_file_path || ""}
            alt="Preview KTP"
          />
        </Box>
      </Fade>
    </Modal>
  );
};

export default ApprovalModal;
