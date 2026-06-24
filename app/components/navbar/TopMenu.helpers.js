export const POLLING_INTERVAL_MS = 10000;

export const priorityColor = {
  low: "default",
  normal: "primary",
  high: "warning",
  urgent: "error",
};

/**
 * Shared style for topbar icon buttons.
 * Keeping the action buttons on one helper avoids tiny visual differences
 * between theme, notification, and account/settings controls.
 */
export const getTopbarActionSx = (theme) => ({
  width: 40,
  height: 40,
  color: theme.palette.primary.main,
  bgcolor: theme.ui.iconButtonBg,
  border: `1px solid ${theme.ui.navBorder}`,
  transition: "background-color 0.2s ease, transform 0.2s ease",
  "&:hover": {
    bgcolor: theme.ui.iconButtonHover,
    transform: "translateY(-1px)",
  },
});

export const isInternalUrl = (url) =>
  typeof url === "string" && url.startsWith("/");

export const wait = (duration) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

/**
 * Resolves the destination URL for every supported notification entity.
 * This keeps route rules centralized so future notification types can be added
 * without hunting through the visual topbar component.
 */
export const getNotificationTargetUrl = (notification, user) => {
  const isTenantTermination =
    notification?.entity_type === "tenant_termination" ||
    notification?.type?.startsWith("tenant_termination");
  const isTenantApplication =
    notification?.entity_type === "tenant_application" ||
    notification?.type?.startsWith("tenant_application") ||
    notification?.type?.startsWith("tenant_approval");
  const progressTerminationNotificationTypes = new Set([
    "tenant_termination_created",
    "tenant_termination_progress",
    "tenant_termination_approval_completed",
    "tenant_termination_rejected_by_you",
    "tenant_termination_approved",
    "tenant_termination_rejected",
  ]);
  const progressApprovalNotificationTypes = new Set([
    "tenant_approval_progress",
    "tenant_approval_completed",
    "tenant_approval_rejected_by_you",
    "tenant_application_approved",
    "tenant_application_rejected",
  ]);

  if (isTenantTermination && notification?.entity_id) {
    const deletedParam =
      notification.type === "tenant_termination_deleted" ? "&deleted=1" : "";
    const isAdminContract = [1, 2].includes(Number(user?.role_id));
    const openMode =
      notification.type === "tenant_termination_waiting"
        ? "detail"
        : progressTerminationNotificationTypes.has(notification.type)
        ? "progress"
        : "detail";
    const basePath = isAdminContract
      ? "/tenant-terminations"
      : "/tenant-terminations-approval";

    return `${basePath}?tenant_early_termination_id=${notification.entity_id}&open=${openMode}${deletedParam}`;
  }

  if (
    progressApprovalNotificationTypes.has(notification?.type) &&
    notification?.entity_id
  ) {
    if ([1, 2].includes(Number(user?.role_id))) {
      return `/tenant-application?tenant_application_id=${notification.entity_id}&open=approval`;
    }

    if ([3, 4, 5, 6, 7].includes(Number(user?.role_id))) {
      return `/tenant-approval?tenant_application_id=${notification.entity_id}&open=progress`;
    }

    return notification?.action_url;
  }

  if (
    isTenantApplication &&
    [1, 2].includes(Number(user?.role_id)) &&
    notification?.entity_id
  ) {
    const deletedParam =
      notification.type === "tenant_application_deleted" ? "&deleted=1" : "";
    const openMode =
      notification.type === "tenant_application_deleted" ? "detail" : "approval";

    return `/tenant-application?tenant_application_id=${notification.entity_id}&open=${openMode}${deletedParam}`;
  }

  if (isTenantApplication && notification?.entity_id) {
    const deletedParam =
      notification.type === "tenant_application_deleted" ? "&deleted=1" : "";
    return `/tenant-approval?tenant_application_id=${notification.entity_id}&open=approval${deletedParam}`;
  }

  if (notification?.entity_type === "payment" && notification?.entity_id) {
    const deletedParam =
      notification.type === "payment_deleted" ? "&deleted=1" : "";
    const progressPaymentNotificationTypes = new Set([
      "payment_approved",
      "payment_rejected",
    ]);
    const openMode = progressPaymentNotificationTypes.has(notification.type)
      ? "progress"
      : "detail";

    return `/payments?payment_id=${notification.entity_id}&open=${openMode}${deletedParam}`;
  }

  if (
    notification?.entity_type === "land_permit_payment" &&
    notification?.entity_id
  ) {
    const deletedParam =
      notification.type === "land_permit_payment_deleted" ? "&deleted=1" : "";
    const openMode = [
      "land_permit_payment_approved",
      "land_permit_payment_rejected",
    ].includes(notification.type)
      ? "progress"
      : "detail";

    return `/land-permit-payments?payment_id=${notification.entity_id}&open=${openMode}${deletedParam}`;
  }

  return notification?.action_url;
};

const persistUrlTarget = (targetUrl, storageKey, readTarget) => {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(targetUrl, window.location.origin);
    const target = readTarget(url);

    if (!target) return;

    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        ...target,
        openMode: url.searchParams.get("open") || target.defaultOpenMode,
        deleted: url.searchParams.get("deleted") === "1",
        requestedAt: Date.now(),
      }),
    );
  } catch (err) {
    console.log(`Error persist notification target ${storageKey}`, err);
  }
};

/**
 * Persists modal targets before navigation.
 * Destination pages read these keys after router.push so the correct detail or
 * progress modal opens even when the route itself has already been mounted.
 */
export const persistNotificationTargets = (targetUrl) => {
  persistUrlTarget(
    targetUrl,
    "sewain:tenant-approval-target",
    (url) => {
      const tenantApplicationId = url.searchParams.get("tenant_application_id");
      if (!tenantApplicationId) return null;
      return {
        tenantApplicationId: Number(tenantApplicationId),
        defaultOpenMode: "approval",
      };
    },
  );

  persistUrlTarget(
    targetUrl,
    "sewain:payment-target",
    (url) => {
      const paymentId = url.searchParams.get("payment_id");
      if (!paymentId) return null;
      return { paymentId: Number(paymentId), defaultOpenMode: "detail" };
    },
  );

  persistUrlTarget(
    targetUrl,
    "sewain:land-permit-payment-target",
    (url) => {
      if (!url.pathname.startsWith("/land-permit-payments")) return null;
      const paymentId = url.searchParams.get("payment_id");
      if (!paymentId) return null;
      return { paymentId: Number(paymentId), defaultOpenMode: "detail" };
    },
  );

  persistUrlTarget(
    targetUrl,
    "sewain:tenant-application-target",
    (url) => {
      const tenantApplicationId = url.searchParams.get("tenant_application_id");
      if (!tenantApplicationId) return null;
      return {
        tenantApplicationId: Number(tenantApplicationId),
        defaultOpenMode: "detail",
      };
    },
  );

  persistUrlTarget(
    targetUrl,
    "sewain:tenant-termination-target",
    (url) => {
      const tenantEarlyTerminationId = url.searchParams.get(
        "tenant_early_termination_id",
      );
      if (!tenantEarlyTerminationId) return null;
      return {
        tenantEarlyTerminationId: Number(tenantEarlyTerminationId),
        defaultOpenMode: "detail",
      };
    },
  );
};

export const dispatchNotificationOpenEvents = () => {
  window.dispatchEvent(new Event("sewain:tenant-approval-notification-open"));
  window.dispatchEvent(new Event("sewain:tenant-application-notification-open"));
  window.dispatchEvent(new Event("sewain:tenant-termination-notification-open"));
  window.dispatchEvent(new Event("sewain:payment-notification-open"));
  window.dispatchEvent(
    new Event("sewain:land-permit-payment-notification-open"),
  );
};

export const isTenantApprovalUrl = (url) =>
  typeof url === "string" && url.startsWith("/tenant-approval");

export const isPaymentUrl = (url) =>
  typeof url === "string" && url.startsWith("/payments");

export const isLandPermitPaymentUrl = (url) =>
  typeof url === "string" && url.startsWith("/land-permit-payments");

export const isTenantApplicationUrl = (url) =>
  typeof url === "string" && url.startsWith("/tenant-application");

export const isTenantTerminationUrl = (url) =>
  typeof url === "string" &&
  (url.startsWith("/tenant-terminations") ||
    url.startsWith("/tenant-terminations-approval"));
