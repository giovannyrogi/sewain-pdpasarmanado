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
