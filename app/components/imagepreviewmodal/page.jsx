import React from "react";
import { Modal, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Icon } from "@iconify/react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

const style = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: 2,
};

const imageBoxStyle = {
  maxWidth: "90vw",
  maxHeight: "80vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fff",
  borderRadius: 8,
  boxShadow: 24,
  position: "relative",
};

const ImagePreviewModal = ({
  open,
  onClose,
  imageUrl,
  alt = "Preview",
  ...props
}) => {
  return (
    <Modal open={open} onClose={onClose} sx={style}>
      <Box sx={imageBoxStyle}>
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "#fff",
            zIndex: 2,
            p: 0,
            m: 0,
            //hover
            "&:hover": {
              background: "#fff",
            },
          }}
        >
          <Icon icon="line-md:close-circle-filled" fontSize={30} color="red" />
        </IconButton>
        <Zoom>
          <img
            src={imageUrl}
            alt={alt}
            style={{
              maxWidth: "90vw",
              maxHeight: "80vh",
              borderRadius: 8,
              border: "1px solid #ddd",
              objectFit: "contain",
            }}
            {...props}
          />
        </Zoom>
      </Box>
    </Modal>
  );
};

export default ImagePreviewModal;
