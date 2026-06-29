/**
 * Shared dashboard card shell.
 * Semua kartu dashboard memakai helper ini supaya background, border, shadow,
 * dan hover state mengikuti token global dari ThemeProvider.
 */
export const getDashboardCardSx = (theme, sx = {}) => ({
  bgcolor: theme.ui.dashboardCardBg,
  borderRadius: 2,
  border: `1px solid ${theme.ui.dashboardCardBorder}`,
  boxShadow: theme.ui.dashboardCardShadow,
  transition:
    "background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: theme.ui.dashboardCardHoverShadow,
  },
  ...sx,
});

/**
 * Shared dashboard divider.
 * Garis header tetap mengambil primary color per theme agar light/dark mode
 * konsisten tanpa hardcode merah/oranye di setiap komponen.
 */
export const getDashboardDividerSx = (theme, sx = {}) => ({
  borderColor: theme.palette.primary.main,
  width: "100%",
  ...sx,
});

/**
 * Shell untuk section dashboard baru.
 * Dipakai oleh panel chart/list supaya spacing dan warna tetap konsisten
 * dengan token theme global, bukan hardcode per komponen.
 */
export const getDashboardPanelSx = (theme, sx = {}) => ({
  bgcolor: theme.ui.dashboardCardBg,
  border: `1px solid ${theme.ui.dashboardCardBorder}`,
  borderRadius: 3,
  boxShadow: theme.ui.dashboardCardShadow,
  overflow: "hidden",
  ...sx,
});

/**
 * Style item kecil di dalam list dashboard.
 * Item dibuat interaktif tetapi tetap tenang untuk dashboard operasional.
 */
export const getDashboardListItemSx = (theme, sx = {}) => ({
  display: "flex",
  alignItems: "center",
  gap: 1.25,
  width: "100%",
  p: 1.25,
  borderRadius: 2,
  border: `1px solid ${theme.ui.dashboardCardBorder}`,
  bgcolor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.035)"
      : "rgba(17, 24, 39, 0.025)",
  transition: "background-color 0.2s ease, border-color 0.2s ease",
  "&:hover": {
    borderColor: theme.palette.primary.main,
    bgcolor:
      theme.palette.mode === "dark"
        ? "rgba(255, 152, 0, 0.08)"
        : "rgba(230, 9, 9, 0.06)",
  },
  ...sx,
});
