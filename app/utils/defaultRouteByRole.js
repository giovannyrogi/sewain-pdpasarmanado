/**
 * Menentukan halaman awal setelah user berhasil login atau terkena fallback
 * route dari middleware. Mapping ini menjaga role khusus tidak diarahkan ke
 * dashboard modul lain yang memang tidak boleh mereka akses.
 */
export const DEFAULT_ROUTE_BY_ROLE = {
  9: "/land-permit-dashboard",
};

export const getDefaultRouteByRole = (roleId) =>
  DEFAULT_ROUTE_BY_ROLE[Number(roleId)] || "/dashboard";
