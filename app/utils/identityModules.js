export const SUPERADMIN_ROLE_ID = 1;
export const ADMIN_KONTRAK_ROLE_ID = 2;
export const ADMIN_IZIN_LAHAN_ROLE_ID = 9;

export const parseFormBoolean = (value) =>
  String(value || "").trim().toLowerCase() === "true";

export const getIdentityRegistrationForRole = ({
  roleId,
  formData,
  existing = {},
}) => {
  const normalizedRoleId = Number(roleId);

  if (normalizedRoleId === SUPERADMIN_ROLE_ID) {
    return {
      is_room_rental_registered: parseFormBoolean(
        formData.get("isRoomRentalRegistered"),
      ),
      is_land_permit_registered: parseFormBoolean(
        formData.get("isLandPermitRegistered"),
      ),
    };
  }

  if (normalizedRoleId === ADMIN_IZIN_LAHAN_ROLE_ID) {
    return {
      is_room_rental_registered: Boolean(
        existing.is_room_rental_registered,
      ),
      is_land_permit_registered: true,
    };
  }

  return {
    is_room_rental_registered: true,
    is_land_permit_registered: Boolean(
      existing.is_land_permit_registered,
    ),
  };
};

export const validateIdentityRegistration = (registration) => {
  if (
    !registration.is_room_rental_registered &&
    !registration.is_land_permit_registered
  ) {
    return "Identitas wajib terdaftar pada minimal satu modul.";
  }

  return null;
};
