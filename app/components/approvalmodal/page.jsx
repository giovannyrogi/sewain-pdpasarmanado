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
  Button,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import moment from "moment";

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

  // Fetch approval list
  const getDataApprovals = async () => {
    setLoadingMessage("Memperbarui data Approval...");
    loadingTrue();
    try {
      const res = await axios.get(`/api/tenant-approval/`, {
        params: { id: selectedData.tenant_application_id },
      });
      // console.log("data approval", res);

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
    if (open && selectedData?.tenant_application_id) {
      getDataApprovals();
    }
  }, [open, selectedData]);

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
              mb: isMobile ? 1 : 0.5,
            }}
          >
            Progress Approval
          </Typography>

          <Divider sx={{ mb: 2, borderColor: theme.palette.primary.main }} />

          <Grid container direction="column" spacing={2}>
            {approvalList &&
              approvalList.map((item, index) => (
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
                          ? "rgba(76, 175, 80, 0.15)"
                          : item.status === "pending"
                          ? "rgba(255, 193, 7, 0.2)"
                          : "rgba(244, 67, 54, 0.15)",
                    }}
                  >
                    {/* Icon / Step Number */}
                    <Box
                      sx={{
                        width: 45,
                        height: 45,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "3px solid",
                        borderColor:
                          item.status === "approved"
                            ? "success.main"
                            : item.status === "pending"
                            ? "warning.main"
                            : "error.main",
                        color:
                          item.status === "approved"
                            ? "success.main"
                            : item.status === "pending"
                            ? "warning.main"
                            : "error.main",
                        fontWeight: "bold",
                      }}
                    >
                      {index + 1}
                    </Box>

                    {/* Role and Approver */}
                    <Box
                      flex={1}
                      display="flex"
                      flexDirection="column"
                      gap={0.5}
                    >
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          fontSize: isMobile ? 14 : 15,
                        }}
                      >
                        {item.role_name}
                      </Typography>

                      {/* Status / Approver */}
                      <Typography
                        sx={{
                          fontSize: isMobile ? 12 : 13,
                          color: "text.secondary",
                        }}
                      >
                        {item.status === "approved"
                          ? `Disetujui oleh: ${item.full_name}`
                          : item.status === "rejected"
                          ? `Ditolak oleh: ${item.full_name}`
                          : "Menunggu Persetujuan"}
                      </Typography>

                      {/* Tanggal */}
                      {(item.status === "approved" ||
                        item.status === "rejected") && (
                        <Typography
                          sx={{
                            fontSize: isMobile ? 12 : 13,
                            color: "text.secondary",
                          }}
                        >
                          Tanggal:{" "}
                          {moment(item.approved_at).format("DD/MM/YYYY HH:mm")}
                        </Typography>
                      )}

                      {/* Catatan hanya untuk ditolak */}
                      {item.status === "rejected" && item.notes && (
                        <Box>
                          <Typography
                            sx={{
                              fontSize: isMobile ? 12 : 13,
                              fontWeight: "bold",
                              color: "text.secondary",
                            }}
                          >
                            Catatan:
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: isMobile ? 12 : 13,
                              color: "text.secondary",
                            }}
                          >
                            {item.notes}
                          </Typography>
                        </Box>
                      )}
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
                      ) : item.status === "pending" ? (
                        <Icon
                          icon="svg-spinners:ring-resize"
                          color={theme.palette.warning.main}
                          width={40}
                          height={40}
                        />
                      ) : (
                        <Icon
                          icon="line-md:close-circle-filled"
                          color={theme.palette.error.main}
                          width={40}
                          height={40}
                        />
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}

            {approvalList?.length > 0 && (
              <Grid size={12} mt={2}>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={onClose}
                  sx={{
                    textTransform: "capitalize",
                  }}
                >
                  Kembali
                </Button>
              </Grid>
            )}
          </Grid>
        </Box>
      </Fade>
    </Modal>
  );
};

export default ApprovalModal;
