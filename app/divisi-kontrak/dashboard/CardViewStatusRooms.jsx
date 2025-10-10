import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import {
  Box,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React from "react";

const CardViewStatusRooms = ({ data, loading }) => {
  const theme = useTheme();
  const { themeMode } = useThemeMode();
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <Paper
      elevation={6}
      sx={{
        backgroundColor: "background.default",
        p: 2,
        height: "300px",
        borderRadius: "15px",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-10px)",
          boxShadow: 0,
        },
      }}
    >
      <Grid container spacing={1}>
        {/* Header */}
        {loading ? (
          <Skeleton
            variant="rounded"
            width="100%"
            height={20}
            animation="wave"
          />
        ) : (
          <Grid size={12}>
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: "bold",
                fontFamily: "poppins",
              }}
            >
              Status Ruangan
            </Typography>
          </Grid>
        )}

        {loading ? undefined : (
          <Divider
            sx={{
              // borderWidth: "1px",
              borderColor: theme.palette.primary.main,
              // mt: 1,
              width: "100%",
              mt: "-5px",
              mb: 1,
            }}
          />
        )}

        {/* Content */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              width: "100%",
              height: "100%",
              mt: 1,
            }}
          >
            <Skeleton
              variant="rounded"
              width="33%"
              height={105}
              animation="wave"
            />
            <Skeleton
              variant="rounded"
              width="33%"
              height={105}
              animation="wave"
            />
            <Skeleton
              variant="rounded"
              width="33%"
              height={105}
              animation="wave"
            />
          </Box>
        ) : (
          <Grid container size={12} spacing={1}>
            Content
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default CardViewStatusRooms;
