const NON_FINANCE_ROLES = [1, 2, 3, 4, 5, 6, 7];
const LAND_PERMIT_APPROVAL_ROLES = [1, 3, 4, 5, 6, 7];
const FINANCE_ROLE = 8;
const SUPERADMIN_ROLE = 1;

const APPROVAL_STEP_ROLES = {
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
};

const APPROVAL_ROLE_LABELS = {
  3: "Kepala Seksi",
  4: "Kepala Sub Divisi",
  5: "Kepala Divisi",
  6: "Direktur Bisnis",
  7: "Direktur Utama",
};

const PRIORITIES = new Set(["low", "normal", "high", "urgent"]);

const sanitizePriority = (priority) =>
  PRIORITIES.has(priority) ? priority : "normal";

const compactDocumentNumber = (documentNumber) =>
  documentNumber?.split("/")?.[0]?.trim() || documentNumber || "-";

const compactContractNumber = (contractNumber) =>
  contractNumber?.split("/")?.[0]?.trim() || contractNumber || "-";

const buildTenantMessage = (value = {}) => {
  const tenant = normalizeTenantInfo(value);
  const doc = compactDocumentNumber(tenant.documentNumber);
  const room = tenant.roomNumber ? `, Ruangan ${tenant.roomNumber}` : "";
  const location = tenant.locationName ? `, Lokasi ${tenant.locationName}` : "";
  return `Dokumen ${doc} atas nama ${tenant.tenantName || "-"}${room}${location}.`;
};

const buildLandPermitMessage = (value = {}) => {
  const location = value.location_name ? ` | ${value.location_name}` : "";
  const sector = value.sector_name ? ` | Sektor ${value.sector_name}` : "";
  const stall = value.stall_number ? ` | Lahan ${value.stall_number}` : "";
  return `Pemohon ${value.tenant_name || "-"}${location}${sector}${stall}.`;
};

const normalizeTenantInfo = (value = {}) => ({
  ...value,
  documentNumber: value.documentNumber ?? value.document_number,
  tenantName: value.tenantName ?? value.tenant_name,
  roomNumber: value.roomNumber ?? value.room_number,
  locationName: value.locationName ?? value.location_name,
});

/**
 * Membuat notifikasi untuk semua user pada role tertentu.
 * Data penerima disimpan per user agar status baca/bersihkan tidak saling
 * mempengaruhi antar akun.
 */
export async function createNotificationForRoles(client, payload) {
  const {
    type,
    title,
    message,
    entityType,
    entityId,
    actionUrl,
    priority = "normal",
    createdBy,
    roleIds,
    metadata = {},
  } = payload;

  if (!type || !title || !message || !Array.isArray(roleIds) || roleIds.length === 0) {
    return null;
  }

  const result = await client.query(
    `
    SELECT create_notification_for_roles(
      $1, $2, $3, $4, $5, $6, $7, $8, $9::integer[], $10::jsonb
    ) AS notification_id
    `,
    [
      type,
      title,
      message,
      entityType || null,
      entityId || null,
      actionUrl || null,
      sanitizePriority(priority),
      createdBy || null,
      [...new Set(roleIds.map(Number).filter(Boolean))],
      JSON.stringify(metadata || {}),
    ],
  );

  return result.rows[0]?.notification_id || null;
}

/**
 * Membuat notifikasi untuk user spesifik. Dipakai untuk pembuat data,
 * uploader pembayaran, atau role yang sudah terlibat tanpa mengirim ke semua role.
 */
export async function createNotificationForUsers(client, payload) {
  const {
    type,
    title,
    message,
    entityType,
    entityId,
    actionUrl,
    priority = "normal",
    createdBy,
    userIds,
    metadata = {},
  } = payload;

  const uniqueUserIds = [...new Set((userIds || []).map(Number).filter(Boolean))];
  if (!type || !title || !message || uniqueUserIds.length === 0) {
    return null;
  }

  const notification = await client.query(
    `
    INSERT INTO notifications (
      type, title, message, entity_type, entity_id,
      action_url, priority, created_by, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
    RETURNING id
    `,
    [
      type,
      title,
      message,
      entityType || null,
      entityId || null,
      actionUrl || null,
      sanitizePriority(priority),
      createdBy || null,
      JSON.stringify(metadata || {}),
    ],
  );

  await client.query(
    `
    INSERT INTO notification_recipients (notification_id, user_id, role_id)
    SELECT $1, u.id, u.role_id
    FROM users u
    WHERE u.id = ANY($2::integer[])
    ON CONFLICT (notification_id, user_id) DO NOTHING
    `,
    [notification.rows[0].id, uniqueUserIds],
  );

  return notification.rows[0].id;
}

/**
 * Membuat notifikasi untuk role tertentu dengan opsi exclude.
 * Ini dipakai pada approval supaya role yang sedang mendapat tugas hanya
 * menerima notifikasi aksi, sementara role lain menerima notifikasi tracking.
 */
async function createNotificationForRolesWithExclusions(client, payload) {
  const {
    type,
    title,
    message,
    entityType,
    entityId,
    actionUrl,
    priority = "normal",
    createdBy,
    roleIds,
    excludeRoleIds = [],
    excludeUserIds = [],
    metadata = {},
  } = payload;

  const targetRoleIds = [...new Set((roleIds || []).map(Number).filter(Boolean))];
  if (!type || !title || !message || targetRoleIds.length === 0) {
    return null;
  }

  const notification = await client.query(
    `
    INSERT INTO notifications (
      type, title, message, entity_type, entity_id,
      action_url, priority, created_by, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
    RETURNING id
    `,
    [
      type,
      title,
      message,
      entityType || null,
      entityId || null,
      actionUrl || null,
      sanitizePriority(priority),
      createdBy || null,
      JSON.stringify(metadata || {}),
    ],
  );

  await client.query(
    `
    INSERT INTO notification_recipients (notification_id, user_id, role_id)
    SELECT $1, u.id, u.role_id
    FROM users u
    WHERE u.role_id = ANY($2::integer[])
      AND NOT (u.role_id = ANY($3::integer[]))
      AND NOT (u.id = ANY($4::integer[]))
    ON CONFLICT (notification_id, user_id) DO NOTHING
    `,
    [
      notification.rows[0].id,
      targetRoleIds,
      [...new Set(excludeRoleIds.map(Number).filter(Boolean))],
      [...new Set(excludeUserIds.map(Number).filter(Boolean))],
    ],
  );

  return notification.rows[0].id;
}

async function getUserContext(client, userId) {
  const result = await client.query(
    `
    SELECT u.id, u.full_name, u.role_id, r.role_name
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE u.id = $1
    LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] || null;
}

async function getRoleUserNames(client, roleId) {
  const result = await client.query(
    `
    SELECT full_name
    FROM users
    WHERE role_id = $1
    ORDER BY full_name ASC
    `,
    [roleId],
  );

  return result.rows.map((row) => row.full_name).filter(Boolean);
}

async function buildRoleLabel(client, roleId) {
  if (!roleId) return "role berikutnya";

  const names = await getRoleUserNames(client, roleId);
  const roleLabel = APPROVAL_ROLE_LABELS[roleId] || `Role ${roleId}`;

  if (names.length === 0) {
    return roleLabel;
  }

  return `${roleLabel} (${names.join(", ")})`;
}

async function archiveWaitingApprovalNotifications(client, tenantId, roleId) {
  await client.query(
    `
    UPDATE notification_recipients nr
    SET
      read_at = COALESCE(nr.read_at, NOW()),
      archived_at = COALESCE(nr.archived_at, NOW())
    FROM notifications n
    WHERE n.id = nr.notification_id
      AND n.type = 'tenant_approval_waiting'
      AND n.entity_type = 'tenant_application'
      AND n.entity_id = $1
      AND nr.role_id = $2
      AND nr.archived_at IS NULL
    `,
    [tenantId, roleId],
  );
}

async function archiveWaitingLandPermitApprovalNotifications(
  client,
  applicationId,
  roleId,
) {
  await client.query(
    `
    UPDATE notification_recipients nr
    SET
      read_at = COALESCE(nr.read_at, NOW()),
      archived_at = COALESCE(nr.archived_at, NOW())
    FROM notifications n
    WHERE n.id = nr.notification_id
      AND n.type = 'land_permit_approval_waiting'
      AND n.entity_type = 'land_permit_application'
      AND n.entity_id = $1
      AND nr.role_id = $2
      AND nr.archived_at IS NULL
    `,
    [applicationId, roleId],
  );
}

async function archiveWaitingTerminationNotifications(client, terminationId, roleId) {
  await client.query(
    `
    UPDATE notification_recipients nr
    SET
      read_at = COALESCE(nr.read_at, NOW()),
      archived_at = COALESCE(nr.archived_at, NOW())
    FROM notifications n
    WHERE n.id = nr.notification_id
      AND n.type = 'tenant_termination_waiting'
      AND n.entity_type = 'tenant_termination'
      AND n.entity_id = $1
      AND nr.role_id = $2
      AND nr.archived_at IS NULL
    `,
    [terminationId, roleId],
  );
}

export async function notifyTenantApprovalActionCompleted(
  client,
  tenant,
  actorId,
  roleId,
  status,
) {
  const actor = await getUserContext(client, actorId);
  const actorRoleLabel =
    APPROVAL_ROLE_LABELS[actor?.role_id] || actor?.role_name || "Approver";

  await archiveWaitingApprovalNotifications(client, tenant.id, roleId);

  await createNotificationForUsers(client, {
    type:
      status === "approved"
        ? "tenant_approval_completed"
        : "tenant_approval_rejected_by_you",
    title:
      status === "approved"
        ? "Approval berhasil diproses"
        : "Penolakan berhasil diproses",
    message:
      status === "approved"
        ? `${buildTenantMessage(tenant)} Anda berhasil melakukan approval sebagai ${actorRoleLabel}.`
        : `${buildTenantMessage(tenant)} Anda berhasil menolak permohonan sebagai ${actorRoleLabel}.`,
    entityType: "tenant_application",
    entityId: tenant.id,
    actionUrl: `/tenant-approval?tenant_application_id=${tenant.id}&open=approval`,
    priority: "normal",
    createdBy: actorId,
    userIds: [actorId],
    metadata: {
      ...tenant,
      documentNumber: compactDocumentNumber(tenant.document_number),
      document_number: compactDocumentNumber(tenant.document_number),
      approved_by_name: actor?.full_name,
      approved_by_role: actorRoleLabel,
      action_status: status,
    },
  });
}

export async function getTenantNotificationContext(client, tenantApplicationId) {
  const result = await client.query(
    `
    SELECT
      ta.id,
      ta.user_id,
      ta.document_number,
      ta.current_step,
      ta.approval_status,
      ti.full_name AS tenant_name,
      r.room_number,
      l.location_name
    FROM tenant_application ta
    LEFT JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
    LEFT JOIN rooms r ON r.id = ta.room_id
    LEFT JOIN locations l ON l.id = ta.location_id
    WHERE ta.id = $1
    LIMIT 1
    `,
    [tenantApplicationId],
  );

  return result.rows[0] || null;
}

export async function getPaymentNotificationContext(client, paymentId) {
  const result = await client.query(
    `
    SELECT
      p.id AS payment_id,
      p.uploaded_by,
      p.payment_number,
      p.amount,
      p.approval_status,
      ta.id AS tenant_application_id,
      ta.user_id AS tenant_created_by,
      ta.document_number,
      ta.payment_type,
      ti.full_name AS tenant_name,
      r.room_number,
      l.location_name
    FROM payments p
    LEFT JOIN tenant_application ta ON ta.id = p.tenant_application_id
    LEFT JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
    LEFT JOIN rooms r ON r.id = ta.room_id
    LEFT JOIN locations l ON l.id = ta.location_id
    WHERE p.id = $1
    LIMIT 1
    `,
    [paymentId],
  );

  return result.rows[0] || null;
}

export async function getTerminationNotificationContext(client, terminationId) {
  const result = await client.query(
    `
    SELECT
      tet.id,
      tet.tenant_application_id,
      tet.processed_by,
      tet.current_step,
      tet.approval_status,
      tet.reason,
      ta.user_id AS tenant_created_by,
      ta.document_number,
      ti.full_name AS tenant_name,
      r.room_number,
      l.location_name
    FROM tenant_early_terminations tet
    JOIN tenant_application ta ON ta.id = tet.tenant_application_id
    LEFT JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
    LEFT JOIN rooms r ON r.id = ta.room_id
    LEFT JOIN locations l ON l.id = ta.location_id
    WHERE tet.id = $1
    LIMIT 1
    `,
    [terminationId],
  );

  return result.rows[0] || null;
}

export async function notifyTerminationCreated(client, termination) {
  const firstApprovalRole =
    APPROVAL_STEP_ROLES[Number(termination.current_step || 1)];
  const waitingRoleLabel = await buildRoleLabel(client, firstApprovalRole);

  await createNotificationForRolesWithExclusions(client, {
    type: "tenant_termination_created",
    title: "Pengajuan nonaktif tenant baru",
    message: `${buildTenantMessage(termination)} Pengajuan nonaktif tenant baru sedang menunggu approval dari ${waitingRoleLabel}.`,
    entityType: "tenant_termination",
    entityId: termination.id,
    actionUrl: `/tenant-terminations-approval?tenant_early_termination_id=${termination.id}&open=progress`,
    priority: "high",
    createdBy: termination.processed_by,
    roleIds: NON_FINANCE_ROLES,
    excludeRoleIds: firstApprovalRole ? [firstApprovalRole] : [],
    excludeUserIds: [termination.processed_by],
    metadata: {
      ...termination,
      documentNumber: compactDocumentNumber(termination.document_number),
      document_number: compactDocumentNumber(termination.document_number),
      waiting_role_id: firstApprovalRole,
      waiting_role_label: waitingRoleLabel,
    },
  });

  if (firstApprovalRole) {
    await createNotificationForRoles(client, {
      type: "tenant_termination_waiting",
      title: "Menunggu approval nonaktif tenant",
      message: `${buildTenantMessage(termination)} Silakan cek dan proses approval nonaktif tenant.`,
      entityType: "tenant_termination",
      entityId: termination.id,
      actionUrl: `/tenant-terminations-approval?tenant_early_termination_id=${termination.id}&open=detail`,
      priority: "urgent",
      createdBy: termination.processed_by,
      roleIds: [firstApprovalRole],
      metadata: {
        ...termination,
        documentNumber: compactDocumentNumber(termination.document_number),
        document_number: compactDocumentNumber(termination.document_number),
        current_approval_role_id: firstApprovalRole,
        waiting_role_label: waitingRoleLabel,
      },
    });
  }
}

export async function notifyTerminationApprovalActionCompleted(
  client,
  termination,
  actorId,
  roleId,
  status,
) {
  const actor = await getUserContext(client, actorId);
  const actorRoleLabel =
    APPROVAL_ROLE_LABELS[actor?.role_id] || actor?.role_name || "Approver";

  await archiveWaitingTerminationNotifications(client, termination.id, roleId);

  await createNotificationForUsers(client, {
    type:
      status === "approved"
        ? "tenant_termination_approval_completed"
        : "tenant_termination_rejected_by_you",
    title:
      status === "approved"
        ? "Approval nonaktif berhasil diproses"
        : "Penolakan nonaktif berhasil diproses",
    message:
      status === "approved"
        ? `${buildTenantMessage(termination)} Anda berhasil melakukan approval nonaktif tenant sebagai ${actorRoleLabel}.`
        : `${buildTenantMessage(termination)} Anda berhasil menolak pengajuan nonaktif tenant sebagai ${actorRoleLabel}.`,
    entityType: "tenant_termination",
    entityId: termination.id,
    actionUrl: `/tenant-terminations-approval?tenant_early_termination_id=${termination.id}&open=progress`,
    priority: "normal",
    createdBy: actorId,
    userIds: [actorId],
    metadata: {
      ...termination,
      documentNumber: compactDocumentNumber(termination.document_number),
      document_number: compactDocumentNumber(termination.document_number),
      approved_by_name: actor?.full_name,
      approved_by_role: actorRoleLabel,
      action_status: status,
    },
  });
}

export async function notifyTerminationApprovalMoved(
  client,
  termination,
  approverId,
  nextRoleId,
) {
  const approver = await getUserContext(client, approverId);
  const approverRoleLabel =
    APPROVAL_ROLE_LABELS[approver?.role_id] || approver?.role_name || "Approver";
  const approverLabel = `${approverRoleLabel}${approver?.full_name ? ` (${approver.full_name})` : ""}`;

  if (!nextRoleId) {
    await createNotificationForRolesWithExclusions(client, {
      type: "tenant_termination_approved",
      title: "Nonaktif tenant disetujui final",
      message: `${buildTenantMessage(termination)} Pengajuan nonaktif tenant disetujui final oleh ${approverLabel}. Ruangan sudah tersedia kembali.`,
      entityType: "tenant_termination",
      entityId: termination.id,
      actionUrl: `/tenant-terminations-approval?tenant_early_termination_id=${termination.id}&open=progress`,
      priority: "high",
      createdBy: approverId,
      roleIds: NON_FINANCE_ROLES,
      excludeRoleIds: [approver?.role_id],
      excludeUserIds: [approverId],
      metadata: {
        ...termination,
        documentNumber: compactDocumentNumber(termination.document_number),
        document_number: compactDocumentNumber(termination.document_number),
        approved_by_name: approver?.full_name,
        approved_by_role: approverRoleLabel,
      },
    });
    return;
  }

  const nextRoleLabel = await buildRoleLabel(client, nextRoleId);

  await createNotificationForRoles(client, {
    type: "tenant_termination_waiting",
    title: "Menunggu approval nonaktif tenant",
    message: `${buildTenantMessage(termination)} Pengajuan nonaktif tenant sudah masuk ke giliran approval Anda.`,
    entityType: "tenant_termination",
    entityId: termination.id,
    actionUrl: `/tenant-terminations-approval?tenant_early_termination_id=${termination.id}&open=detail`,
    priority: "urgent",
    createdBy: approverId,
    roleIds: [nextRoleId],
    metadata: {
      ...termination,
      documentNumber: compactDocumentNumber(termination.document_number),
      document_number: compactDocumentNumber(termination.document_number),
      current_approval_role_id: nextRoleId,
      waiting_role_label: nextRoleLabel,
    },
  });

  await createNotificationForRolesWithExclusions(client, {
    type: "tenant_termination_progress",
    title: `${approverLabel} sudah approve nonaktif`,
    message: `${buildTenantMessage(termination)} ${approverLabel} sudah approve pengajuan nonaktif tenant. Menunggu approval dari ${nextRoleLabel}.`,
    entityType: "tenant_termination",
    entityId: termination.id,
    actionUrl: `/tenant-terminations-approval?tenant_early_termination_id=${termination.id}&open=progress`,
    priority: "normal",
    createdBy: approverId,
    roleIds: NON_FINANCE_ROLES,
    excludeRoleIds: [approver?.role_id],
    excludeUserIds: [approverId],
    metadata: {
      ...termination,
      documentNumber: compactDocumentNumber(termination.document_number),
      document_number: compactDocumentNumber(termination.document_number),
      approved_by_name: approver?.full_name,
      approved_by_role: approverRoleLabel,
      waiting_role_id: nextRoleId,
      waiting_role_label: nextRoleLabel,
    },
  });
}

export async function notifyTerminationRejected(client, termination, approverId, notes) {
  const approver = await getUserContext(client, approverId);
  const approverRoleLabel =
    APPROVAL_ROLE_LABELS[approver?.role_id] || approver?.role_name || "Approver";

  await createNotificationForRolesWithExclusions(client, {
    type: "tenant_termination_rejected",
    title: "Pengajuan nonaktif tenant ditolak",
    message: `${buildTenantMessage(termination)} Pengajuan nonaktif tenant ditolak oleh ${approverRoleLabel}${approver?.full_name ? ` (${approver.full_name})` : ""}.`,
    entityType: "tenant_termination",
    entityId: termination.id,
    actionUrl: `/tenant-terminations-approval?tenant_early_termination_id=${termination.id}&open=progress`,
    priority: "high",
    createdBy: approverId,
    roleIds: NON_FINANCE_ROLES,
    excludeRoleIds: [approver?.role_id],
    excludeUserIds: [approverId],
    metadata: {
      ...termination,
      documentNumber: compactDocumentNumber(termination.document_number),
      document_number: compactDocumentNumber(termination.document_number),
      rejected_by_name: approver?.full_name,
      rejected_by_role: approverRoleLabel,
      rejection_notes: notes || null,
    },
  });
}

export async function notifyTerminationDeleted(client, termination, deletedBy) {
  const deleter = await getUserContext(client, deletedBy);
  const deleterRoleLabel =
    APPROVAL_ROLE_LABELS[deleter?.role_id] || deleter?.role_name || "User";
  const deleterLabel = `${deleterRoleLabel}${deleter?.full_name ? ` (${deleter.full_name})` : ""}`;

  await createNotificationForRolesWithExclusions(client, {
    type: "tenant_termination_deleted",
    title: "Pengajuan nonaktif tenant dihapus",
    message: `${buildTenantMessage(termination)} Pengajuan nonaktif tenant telah dihapus oleh ${deleterLabel}.`,
    entityType: "tenant_termination",
    entityId: termination.id,
    actionUrl: `/tenant-terminations?tenant_early_termination_id=${termination.id}&open=detail&deleted=1`,
    priority: "high",
    createdBy: deletedBy,
    roleIds: NON_FINANCE_ROLES,
    excludeUserIds: [deletedBy],
    metadata: {
      ...termination,
      documentNumber: compactDocumentNumber(termination.document_number),
      document_number: compactDocumentNumber(termination.document_number),
      deleted_by_name: deleter?.full_name,
      deleted_by_role: deleterRoleLabel,
    },
  });
}

export async function notifyTenantApplicationCreated(client, tenant) {
  const firstApprovalRole = APPROVAL_STEP_ROLES[Number(tenant.current_step || 1)];
  const waitingRoleLabel = await buildRoleLabel(client, firstApprovalRole);

  const trackingMessage = `${buildTenantMessage(tenant)} Permohonan sewa baru masuk dan sedang menunggu approval dari ${waitingRoleLabel}.`;

  await createNotificationForRolesWithExclusions(client, {
    type: "tenant_application_created",
    title: "Permohonan sewa baru",
    message: trackingMessage,
    entityType: "tenant_application",
    entityId: tenant.id,
    actionUrl: `/tenant-approval?tenant_application_id=${tenant.id}&open=approval`,
    priority: "high",
    createdBy: tenant.user_id,
    roleIds: NON_FINANCE_ROLES,
    excludeRoleIds: firstApprovalRole ? [firstApprovalRole] : [],
    excludeUserIds: [tenant.user_id],
    metadata: {
      ...tenant,
      documentNumber: compactDocumentNumber(tenant.documentNumber),
      document_number: compactDocumentNumber(tenant.document_number),
      waiting_role_id: firstApprovalRole,
      waiting_role_label: waitingRoleLabel,
    },
  });

  if (firstApprovalRole) {
    await createNotificationForRoles(client, {
      type: "tenant_approval_waiting",
      title: "Menunggu approval Anda",
      message: `${buildTenantMessage(tenant)} Silakan cek dan proses approval permohonan sewa.`,
      entityType: "tenant_application",
      entityId: tenant.id,
      actionUrl: `/tenant-approval?tenant_application_id=${tenant.id}&open=approval`,
      priority: "urgent",
      createdBy: tenant.user_id,
      roleIds: [firstApprovalRole],
      metadata: {
        ...tenant,
        documentNumber: compactDocumentNumber(tenant.documentNumber),
        document_number: compactDocumentNumber(tenant.document_number),
        current_approval_role_id: firstApprovalRole,
      },
    });
  }
}

export async function notifyTenantApplicationUpdated(client, tenant, updatedBy) {
  const updater = await getUserContext(client, updatedBy);
  const updaterRoleLabel =
    APPROVAL_ROLE_LABELS[updater?.role_id] || updater?.role_name || "User";
  const updaterLabel = `${updaterRoleLabel}${updater?.full_name ? ` (${updater.full_name})` : ""}`;

  await createNotificationForRolesWithExclusions(client, {
    type: "tenant_application_updated",
    title: "Permohonan sewa diperbarui",
    message: `${buildTenantMessage(tenant)} Data permohonan telah diperbarui oleh ${updaterLabel}.`,
    entityType: "tenant_application",
    entityId: tenant.id,
    actionUrl: `/tenant-approval?tenant_application_id=${tenant.id}&open=approval`,
    priority: "normal",
    createdBy: updatedBy || tenant.user_id,
    roleIds: NON_FINANCE_ROLES,
    excludeUserIds: [updatedBy],
    metadata: {
      ...tenant,
      documentNumber: compactDocumentNumber(tenant.documentNumber),
      document_number: compactDocumentNumber(tenant.document_number),
      updated_by_name: updater?.full_name,
      updated_by_role: updaterRoleLabel,
    },
  });
}

export async function notifyTenantApplicationDeleted(client, tenant, deletedBy) {
  const deleter = await getUserContext(client, deletedBy);
  const deleterRoleLabel =
    APPROVAL_ROLE_LABELS[deleter?.role_id] || deleter?.role_name || "User";
  const deleterLabel = `${deleterRoleLabel}${deleter?.full_name ? ` (${deleter.full_name})` : ""}`;

  await createNotificationForRolesWithExclusions(client, {
    type: "tenant_application_deleted",
    title: "Permohonan sewa dihapus",
    message: `${buildTenantMessage(tenant)} Data permohonan telah dihapus oleh ${deleterLabel}.`,
    entityType: "tenant_application",
    entityId: tenant.id,
    actionUrl: "/tenant-application",
    priority: "high",
    createdBy: deletedBy || tenant.user_id,
    roleIds: NON_FINANCE_ROLES,
    excludeUserIds: [deletedBy],
    metadata: {
      ...tenant,
      documentNumber: compactDocumentNumber(tenant.documentNumber),
      document_number: compactDocumentNumber(tenant.document_number),
      deleted_by_name: deleter?.full_name,
      deleted_by_role: deleterRoleLabel,
    },
  });
}

export async function notifyTenantApprovalMoved(client, tenant, approverId, nextRoleId) {
  const approver = await getUserContext(client, approverId);
  const approverRoleLabel =
    APPROVAL_ROLE_LABELS[approver?.role_id] || approver?.role_name || "Approver";
  const approverLabel = `${approverRoleLabel}${approver?.full_name ? ` (${approver.full_name})` : ""}`;

  if (!nextRoleId) {
    await createNotificationForRolesWithExclusions(client, {
      type: "tenant_application_approved",
      title: "Permohonan sewa disetujui final",
      message: `${buildTenantMessage(tenant)} Permohonan sewa sudah disetujui final oleh ${approverLabel}.`,
      entityType: "tenant_application",
      entityId: tenant.id,
      actionUrl: `/tenant-approval?tenant_application_id=${tenant.id}&open=approval`,
      priority: "high",
      createdBy: approverId,
      roleIds: NON_FINANCE_ROLES,
      excludeRoleIds: [approver?.role_id],
      excludeUserIds: [approverId],
      metadata: {
        ...tenant,
        documentNumber: compactDocumentNumber(tenant.document_number),
        document_number: compactDocumentNumber(tenant.document_number),
        approved_by_name: approver?.full_name,
        approved_by_role: approverRoleLabel,
      },
    });
    return;
  }

  const nextRoleLabel = await buildRoleLabel(client, nextRoleId);

  await createNotificationForRoles(client, {
    type: "tenant_approval_waiting",
    title: "Menunggu approval Anda",
    message: `${buildTenantMessage(tenant)} Permohonan sudah masuk ke giliran approval Anda.`,
    entityType: "tenant_application",
    entityId: tenant.id,
    actionUrl: `/tenant-approval?tenant_application_id=${tenant.id}&open=approval`,
    priority: "urgent",
    createdBy: approverId,
    roleIds: [nextRoleId],
    metadata: {
      ...tenant,
      documentNumber: compactDocumentNumber(tenant.document_number),
      document_number: compactDocumentNumber(tenant.document_number),
      current_approval_role_id: nextRoleId,
      waiting_role_label: nextRoleLabel,
    },
  });

  await createNotificationForRolesWithExclusions(client, {
    type: "tenant_approval_progress",
    title: `${approverLabel} sudah approve`,
    message: `${buildTenantMessage(tenant)} Sudah diapprove oleh ${approverLabel} dan sekarang menunggu approval dari ${nextRoleLabel}.`,
    entityType: "tenant_application",
    entityId: tenant.id,
    actionUrl: `/tenant-approval?tenant_application_id=${tenant.id}&open=approval`,
    priority: "normal",
    createdBy: approverId,
    roleIds: NON_FINANCE_ROLES,
    excludeRoleIds: [approver?.role_id],
    excludeUserIds: [approverId],
    metadata: {
      ...tenant,
      documentNumber: compactDocumentNumber(tenant.document_number),
      document_number: compactDocumentNumber(tenant.document_number),
      approved_by_name: approver?.full_name,
      approved_by_role: approverRoleLabel,
      waiting_role_id: nextRoleId,
      waiting_role_label: nextRoleLabel,
    },
  });
}

export async function notifyTenantApprovalRejected(client, tenant, approverId, notes) {
  const approver = await getUserContext(client, approverId);
  const approverRoleLabel =
    APPROVAL_ROLE_LABELS[approver?.role_id] || approver?.role_name || "Approver";

  await createNotificationForRolesWithExclusions(client, {
    type: "tenant_application_rejected",
    title: "Permohonan sewa ditolak",
    message: `${buildTenantMessage(tenant)} Ditolak oleh ${approverRoleLabel}${approver?.full_name ? ` (${approver.full_name})` : ""}. Alasan: ${notes || "-"}`,
    entityType: "tenant_application",
    entityId: tenant.id,
    actionUrl: "/tenant-application",
    priority: "high",
    createdBy: approverId,
    roleIds: NON_FINANCE_ROLES,
    excludeRoleIds: [approver?.role_id],
    excludeUserIds: [approverId],
    metadata: {
      ...tenant,
      documentNumber: compactDocumentNumber(tenant.document_number),
      document_number: compactDocumentNumber(tenant.document_number),
      rejected_by_name: approver?.full_name,
      rejected_by_role: approverRoleLabel,
      rejection_notes: notes || null,
    },
  });
}

export async function notifyPaymentSubmitted(client, payment, createdBy) {
  const creator = await getUserContext(client, createdBy);
  const creatorRoleLabel = creator?.role_name || "User";

  await createNotificationForRolesWithExclusions(client, {
    type: "payment_submitted",
    title: "Bukti pembayaran baru",
    message: `${buildTenantMessage(payment)} Bukti pembayaran nomor ${payment.payment_number || 1} dibuat oleh ${creatorRoleLabel}${creator?.full_name ? ` (${creator.full_name})` : ""} dan menunggu validasi keuangan.`,
    entityType: "payment",
    entityId: payment.payment_id,
    actionUrl: `/payments?payment_id=${payment.payment_id}&open=detail`,
    priority: "urgent",
    createdBy,
    roleIds: [SUPERADMIN_ROLE, FINANCE_ROLE],
    excludeUserIds: [createdBy],
    metadata: {
      ...payment,
      documentNumber: compactDocumentNumber(payment.document_number),
      document_number: compactDocumentNumber(payment.document_number),
      submitted_by_name: creator?.full_name,
      submitted_by_role: creatorRoleLabel,
    },
  });
}

export async function getLandPermitNotificationContext(client, applicationId) {
  const result = await client.query(
    `
    SELECT
      app.id,
      app.user_id,
      app.current_step,
      app.approval_status,
      app.commodity_type,
      identity.full_name AS tenant_name,
      location.location_name,
      sector.sector_name,
      stall.stall_number
    FROM land_permit_applications app
    JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
    JOIN locations location ON location.id = app.location_id
    JOIN land_sectors sector ON sector.id = app.sector_id
    JOIN land_stalls stall ON stall.id = app.stall_id
    WHERE app.id = $1
    LIMIT 1
    `,
    [applicationId],
  );

  return result.rows[0] || null;
}

export async function getLandPermitPaymentNotificationContext(client, paymentId) {
  const result = await client.query(
    `
    SELECT
      payment.id AS payment_id,
      payment.uploaded_by,
      payment.amount,
      payment.approval_status,
      app.id AS land_permit_application_id,
      app.user_id AS application_created_by,
      app.commodity_type,
      identity.full_name AS tenant_name,
      location.location_name,
      sector.sector_name,
      stall.stall_number
    FROM land_permit_payments payment
    JOIN land_permit_applications app
      ON app.id = payment.land_permit_application_id
    JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
    JOIN locations location ON location.id = app.location_id
    JOIN land_sectors sector ON sector.id = app.sector_id
    JOIN land_stalls stall ON stall.id = app.stall_id
    WHERE payment.id = $1
    LIMIT 1
    `,
    [paymentId],
  );

  return result.rows[0] || null;
}

export async function notifyLandPermitSubmitted(
  client,
  application,
  createdBy,
) {
  await createNotificationForRoles(client, {
    type: "land_permit_approval_waiting",
    title: "Menunggu approval izin lahan",
    message: `${buildLandPermitMessage(application)} Perlu approval Anda.`,
    entityType: "land_permit_application",
    entityId: application.id,
    actionUrl: `/land-permit-approval?land_permit_application_id=${application.id}&open=approval`,
    priority: "urgent",
    createdBy,
    roleIds: [3],
    metadata: {
      ...application,
      module: "land_permit",
      current_approval_role_id: 3,
    },
  });
}

export async function notifyLandPermitResubmitted(
  client,
  application,
  resumeStep,
) {
  const roleId = APPROVAL_STEP_ROLES[Number(resumeStep)];
  if (!roleId) return;

  await createNotificationForRoles(client, {
    type: "land_permit_approval_waiting",
    title: "Permohonan izin lahan diperbarui",
    message: `${buildLandPermitMessage(application)} Data diperbarui dan kembali menunggu approval Anda.`,
    entityType: "land_permit_application",
    entityId: application.id,
    actionUrl: `/land-permit-approval?land_permit_application_id=${application.id}&open=approval`,
    priority: "urgent",
    createdBy: application.user_id,
    roleIds: [roleId],
    metadata: {
      ...application,
      module: "land_permit",
      current_approval_role_id: roleId,
      resumed_step: Number(resumeStep),
    },
  });
}

export async function notifyLandPermitApprovalActionCompleted(
  client,
  application,
  actorId,
  roleId,
  status,
) {
  const actor = await getUserContext(client, actorId);
  const roleLabel =
    APPROVAL_ROLE_LABELS[actor?.role_id] || actor?.role_name || "Approver";

  await archiveWaitingLandPermitApprovalNotifications(
    client,
    application.id,
    roleId,
  );

  await createNotificationForUsers(client, {
    type:
      status === "approved"
        ? "land_permit_approval_completed"
        : "land_permit_approval_rejected_by_you",
    title:
      status === "approved"
        ? "Approval izin lahan berhasil"
        : "Penolakan izin lahan berhasil",
    message: `${buildLandPermitMessage(application)} Anda ${status === "approved" ? "menyetujui" : "menolak"} sebagai ${roleLabel}.`,
    entityType: "land_permit_application",
    entityId: application.id,
    actionUrl: `/land-permit-approval?land_permit_application_id=${application.id}&open=progress`,
    createdBy: actorId,
    userIds: [actorId],
    metadata: {
      ...application,
      module: "land_permit",
      action_status: status,
      processed_by_name: actor?.full_name,
      processed_by_role: roleLabel,
    },
  });
}

export async function notifyLandPermitApprovalMoved(
  client,
  application,
  actorId,
  nextRoleId,
) {
  const actor = await getUserContext(client, actorId);
  const actorRole =
    APPROVAL_ROLE_LABELS[actor?.role_id] || actor?.role_name || "Approver";

  if (!nextRoleId) {
    await createNotificationForRolesWithExclusions(client, {
      type: "land_permit_application_approved",
      title: "Izin lahan disetujui final",
      message: `${buildLandPermitMessage(application)} Persetujuan final selesai.`,
      entityType: "land_permit_application",
      entityId: application.id,
      actionUrl: `/land-permit-approval?land_permit_application_id=${application.id}&open=progress`,
      priority: "high",
      createdBy: actorId,
      roleIds: LAND_PERMIT_APPROVAL_ROLES,
      excludeUserIds: [actorId],
      metadata: {
        ...application,
        module: "land_permit",
        approved_by_name: actor?.full_name,
        approved_by_role: actorRole,
      },
    });
    await createNotificationForRoles(client, {
      type: "land_permit_application_approved",
      title: "Izin lahan disetujui final",
      message: `${buildLandPermitMessage(application)} Persetujuan final selesai.`,
      entityType: "land_permit_application",
      entityId: application.id,
      actionUrl: `/land-permit-applications?land_permit_application_id=${application.id}&open=approval`,
      priority: "high",
      createdBy: actorId,
      roleIds: [9],
      metadata: {
        ...application,
        module: "land_permit",
        approved_by_name: actor?.full_name,
        approved_by_role: actorRole,
      },
    });
    return;
  }

  const nextRoleLabel = await buildRoleLabel(client, nextRoleId);
  await createNotificationForRoles(client, {
    type: "land_permit_approval_waiting",
    title: "Menunggu approval izin lahan",
    message: `${buildLandPermitMessage(application)} Perlu approval Anda.`,
    entityType: "land_permit_application",
    entityId: application.id,
    actionUrl: `/land-permit-approval?land_permit_application_id=${application.id}&open=approval`,
    priority: "urgent",
    createdBy: actorId,
    roleIds: [nextRoleId],
    metadata: {
      ...application,
      module: "land_permit",
      current_approval_role_id: nextRoleId,
      waiting_role_label: nextRoleLabel,
    },
  });

  await createNotificationForRolesWithExclusions(client, {
    type: "land_permit_approval_progress",
    title: `${actorRole} sudah approve izin lahan`,
    message: `${buildLandPermitMessage(application)} Disetujui ${actorRole}; menunggu ${nextRoleLabel}.`,
    entityType: "land_permit_application",
    entityId: application.id,
    actionUrl: `/land-permit-approval?land_permit_application_id=${application.id}&open=progress`,
    createdBy: actorId,
    roleIds: LAND_PERMIT_APPROVAL_ROLES,
    excludeRoleIds: [nextRoleId],
    excludeUserIds: [actorId],
    metadata: {
      ...application,
      module: "land_permit",
      approved_by_name: actor?.full_name,
      approved_by_role: actorRole,
      waiting_role_id: nextRoleId,
      waiting_role_label: nextRoleLabel,
    },
  });
}

export async function notifyLandPermitApprovalRejected(
  client,
  application,
  actorId,
) {
  const actor = await getUserContext(client, actorId);
  const roleLabel =
    APPROVAL_ROLE_LABELS[actor?.role_id] || actor?.role_name || "Approver";

  await createNotificationForRolesWithExclusions(client, {
    type: "land_permit_application_rejected",
    title: "Permohonan izin lahan ditolak",
    message: `${buildLandPermitMessage(application)} Ditolak oleh ${roleLabel}${actor?.full_name ? ` (${actor.full_name})` : ""}.`,
    entityType: "land_permit_application",
    entityId: application.id,
    actionUrl: "/land-permit-applications",
    priority: "high",
    createdBy: actorId,
    roleIds: LAND_PERMIT_APPROVAL_ROLES,
    excludeUserIds: [actorId],
    metadata: {
      ...application,
      module: "land_permit",
      rejected_by_name: actor?.full_name,
      rejected_by_role: roleLabel,
    },
  });
  await createNotificationForRoles(client, {
    type: "land_permit_application_rejected",
    title: "Permohonan izin lahan ditolak",
    message: `${buildLandPermitMessage(application)} Ditolak oleh ${roleLabel}${actor?.full_name ? ` (${actor.full_name})` : ""}.`,
    entityType: "land_permit_application",
    entityId: application.id,
    actionUrl: "/land-permit-applications",
    priority: "high",
    createdBy: actorId,
    roleIds: [9],
    metadata: {
      ...application,
      module: "land_permit",
      rejected_by_name: actor?.full_name,
      rejected_by_role: roleLabel,
    },
  });
}

export async function notifyPaymentUpdated(client, payment, updatedBy) {
  const updater = await getUserContext(client, updatedBy);
  const updaterRoleLabel = updater?.role_name || "User";

  await createNotificationForRolesWithExclusions(client, {
    type: "payment_updated",
    title: "Bukti pembayaran diperbarui",
    message: `${buildTenantMessage(payment)} Bukti pembayaran diperbarui oleh ${updaterRoleLabel}${updater?.full_name ? ` (${updater.full_name})` : ""} dan perlu divalidasi ulang.`,
    entityType: "payment",
    entityId: payment.payment_id,
    actionUrl: `/payments?payment_id=${payment.payment_id}&open=detail`,
    priority: "high",
    createdBy: updatedBy,
    roleIds: [SUPERADMIN_ROLE, FINANCE_ROLE],
    excludeUserIds: [updatedBy],
    metadata: {
      ...payment,
      documentNumber: compactDocumentNumber(payment.document_number),
      document_number: compactDocumentNumber(payment.document_number),
      updated_by_name: updater?.full_name,
      updated_by_role: updaterRoleLabel,
    },
  });
}

export async function notifyPaymentDeleted(client, payment, deletedBy) {
  const deleter = await getUserContext(client, deletedBy);
  const deleterRoleLabel = deleter?.role_name || "User";

  await createNotificationForRolesWithExclusions(client, {
    type: "payment_deleted",
    title: "Bukti pembayaran dihapus",
    message: `${buildTenantMessage(payment)} Bukti pembayaran telah dihapus oleh ${deleterRoleLabel}${deleter?.full_name ? ` (${deleter.full_name})` : ""}.`,
    entityType: "payment",
    entityId: payment.payment_id,
    actionUrl: `/payments?payment_id=${payment.payment_id}&open=detail&deleted=1`,
    priority: "high",
    createdBy: deletedBy,
    roleIds: [SUPERADMIN_ROLE, FINANCE_ROLE],
    excludeUserIds: [deletedBy],
    metadata: {
      ...payment,
      documentNumber: compactDocumentNumber(payment.document_number),
      document_number: compactDocumentNumber(payment.document_number),
      deleted_by_name: deleter?.full_name,
      deleted_by_role: deleterRoleLabel,
    },
  });
}

export async function notifyPaymentDecision(client, payment, approverId, status, notes) {
  const approver = await getUserContext(client, approverId);
  const approverRoleLabel = approver?.role_name || "User";

  await createNotificationForUsers(client, {
    type: status === "approved" ? "payment_approved" : "payment_rejected",
    title: status === "approved" ? "Pembayaran disetujui" : "Pembayaran ditolak",
    message:
      status === "approved"
        ? `${buildTenantMessage(payment)} Bukti pembayaran telah divalidasi oleh ${approverRoleLabel}${approver?.full_name ? ` (${approver.full_name})` : ""}.`
        : `${buildTenantMessage(payment)} Bukti pembayaran ditolak oleh ${approverRoleLabel}${approver?.full_name ? ` (${approver.full_name})` : ""}. Tekan notifikasi ini untuk melihat alasan penolakan.`,
    entityType: "payment",
    entityId: payment.payment_id,
    actionUrl: `/payments?payment_id=${payment.payment_id}&open=progress`,
    priority: status === "approved" ? "normal" : "high",
    createdBy: approverId,
    userIds: [payment.uploaded_by, payment.tenant_created_by].filter(
      (userId) => Number(userId) !== Number(approverId),
    ),
    metadata: {
      ...payment,
      documentNumber: compactDocumentNumber(payment.document_number),
      document_number: compactDocumentNumber(payment.document_number),
      decision_notes: notes || null,
      decided_by_name: approver?.full_name,
      decided_by_role: approverRoleLabel,
    },
  });
}

export async function notifyLandPermitPaymentSubmitted(
  client,
  payment,
  createdBy,
) {
  const creator = await getUserContext(client, createdBy);

  await createNotificationForRolesWithExclusions(client, {
    type: "land_permit_payment_submitted",
    title: "Bukti pembayaran izin lahan baru",
    message: `${buildLandPermitMessage(payment)} Bukti bayar menunggu verifikasi keuangan.`,
    entityType: "land_permit_payment",
    entityId: payment.payment_id,
    actionUrl: `/land-permit-payments?payment_id=${payment.payment_id}&open=detail`,
    priority: "urgent",
    createdBy,
    roleIds: [SUPERADMIN_ROLE, FINANCE_ROLE],
    excludeUserIds: [createdBy],
    metadata: {
      ...payment,
      module: "land_permit",
      submitted_by_name: creator?.full_name,
      submitted_by_role: creator?.role_name,
    },
  });
}

export async function notifyLandPermitPaymentUpdated(
  client,
  payment,
  updatedBy,
) {
  const updater = await getUserContext(client, updatedBy);

  await createNotificationForRolesWithExclusions(client, {
    type: "land_permit_payment_updated",
    title: "Bukti pembayaran izin lahan diperbarui",
    message: `${buildLandPermitMessage(payment)} Bukti bayar diperbarui dan perlu diverifikasi ulang.`,
    entityType: "land_permit_payment",
    entityId: payment.payment_id,
    actionUrl: `/land-permit-payments?payment_id=${payment.payment_id}&open=detail`,
    priority: "high",
    createdBy: updatedBy,
    roleIds: [SUPERADMIN_ROLE, FINANCE_ROLE],
    excludeUserIds: [updatedBy],
    metadata: {
      ...payment,
      module: "land_permit",
      updated_by_name: updater?.full_name,
      updated_by_role: updater?.role_name,
    },
  });
}

export async function notifyLandPermitPaymentDeleted(
  client,
  payment,
  deletedBy,
) {
  const deleter = await getUserContext(client, deletedBy);

  await createNotificationForRolesWithExclusions(client, {
    type: "land_permit_payment_deleted",
    title: "Bukti pembayaran izin lahan dihapus",
    message: `${buildLandPermitMessage(payment)} Bukti bayar dihapus.`,
    entityType: "land_permit_payment",
    entityId: payment.payment_id,
    actionUrl: `/land-permit-payments?payment_id=${payment.payment_id}&open=detail&deleted=1`,
    priority: "high",
    createdBy: deletedBy,
    roleIds: [SUPERADMIN_ROLE, FINANCE_ROLE],
    excludeUserIds: [deletedBy],
    metadata: {
      ...payment,
      module: "land_permit",
      deleted_by_name: deleter?.full_name,
      deleted_by_role: deleter?.role_name,
    },
  });
}

export async function notifyLandPermitPaymentDecision(
  client,
  payment,
  approverId,
  status,
  notes,
) {
  const approver = await getUserContext(client, approverId);

  await createNotificationForUsers(client, {
    type:
      status === "approved"
        ? "land_permit_payment_approved"
        : "land_permit_payment_rejected",
    title:
      status === "approved"
        ? "Pembayaran izin lahan disetujui"
        : "Pembayaran izin lahan ditolak",
    message:
      status === "approved"
        ? `${buildLandPermitMessage(payment)} Pembayaran sudah diverifikasi keuangan.`
        : `${buildLandPermitMessage(payment)} Pembayaran ditolak. Tekan notifikasi untuk melihat alasan penolakan.`,
    entityType: "land_permit_payment",
    entityId: payment.payment_id,
    actionUrl: `/land-permit-payments?payment_id=${payment.payment_id}&open=progress`,
    priority: status === "approved" ? "normal" : "high",
    createdBy: approverId,
    userIds: [payment.uploaded_by, payment.application_created_by].filter(
      (userId) => Number(userId) !== Number(approverId),
    ),
    metadata: {
      ...payment,
      module: "land_permit",
      decision_notes: notes || null,
      decided_by_name: approver?.full_name,
      decided_by_role: approver?.role_name,
    },
  });
}

export async function notifyContractCreated(client, contract, createdBy) {
  const compactContract = compactContractNumber(contract.contract_number);

  await createNotificationForRolesWithExclusions(client, {
    type: "contract_created",
    title: "Kontrak baru dibuat",
    message: `${buildTenantMessage(contract)} Nomor kontrak ${compactContract} telah dibuat.`,
    entityType: "contract",
    entityId: contract.contract_id,
    actionUrl: "/contracts",
    priority: "normal",
    createdBy,
    roleIds: NON_FINANCE_ROLES,
    excludeUserIds: [createdBy],
    metadata: {
      ...contract,
      documentNumber: compactDocumentNumber(contract.document_number),
      document_number: compactDocumentNumber(contract.document_number),
      contractNumber: compactContract,
      contract_number: compactContract,
    },
  });
}
