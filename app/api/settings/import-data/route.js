import pool from "@/lib/dbConfig";
import xlsx from "xlsx";

/**
 * API Import master data from Excel (multipart/form-data)
 * Expected form field: "file" (the uploaded excel file)
 *
 * Sheets supported (case-insensitive):
 * - locations
 * - location_floor_prices
 * - rooms
 * - tenant_identities
 *
 * Behavior:
 * - Uses a DB transaction. If any insert fails, rollback and return error.
 * - Uses simple detection/upsert logic:
 *   * locations: tries match by location_code (if provided), otherwise by location_name.
 *   * location_floor_prices: expects a matching location (by location_code or name).
 *   * rooms: expects location to exist; links floor_id if floor row inserted/found.
 *   * tenant_identities: upsert by nik (unique).
 *
 * Response: summary of counts inserted/updated/skipped.
 */

export const config = {
  api: {
    bodyParser: false, // we use req.formData()
  },
};

function normalizeSheetName(name = "") {
  return String(name || "")
    .trim()
    .toLowerCase();
}

function getCellValue(row, key) {
  const v = row[key];
  if (v === undefined) return null;
  if (typeof v === "string") return v.trim();
  return v;
}

async function readWorkbookFromFormData(req) {
  // Next.js request supports req.formData() in server environment
  const form = await req.formData();
  const file = form.get("file");
  if (!file)
    throw new Error(
      "File not provided. Please attach file field named 'file'."
    );

  // file is a File-like object; get arrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const wb = xlsx.read(buffer, { type: "buffer" });
  return wb;
}

export async function POST(req) {
  const client = await pool.connect();
  try {
    const workbook = await readWorkbookFromFormData(req);

    // Build map of sheets by normalized name
    const sheets = {};
    workbook.SheetNames.forEach((n) => {
      sheets[normalizeSheetName(n)] = workbook.Sheets[n];
    });

    // Helper to parse a sheet to JSON using header row
    function sheetToJson(sheet) {
      if (!sheet) return [];
      // use xlsx utils
      const raw = xlsx.utils.sheet_to_json(sheet, { defval: null });
      return raw;
    }

    const locationsSheet = sheetToJson(
      sheets["locations"] || sheets["location"] || sheets["lokasi"]
    );
    const floorsSheet = sheetToJson(
      sheets["location_floor_prices"] ||
        sheets["location_floor_price"] ||
        sheets["floors"]
    );
    const roomsSheet = sheetToJson(
      sheets["rooms"] || sheets["ruangan"] || sheets["room"]
    );
    const tenantsSheet = sheetToJson(
      sheets["tenant_identities"] ||
        sheets["tenant_identity"] ||
        sheets["tenants"]
    );

    // Basic validation: at least one sheet present
    if (
      locationsSheet.length === 0 &&
      floorsSheet.length === 0 &&
      roomsSheet.length === 0 &&
      tenantsSheet.length === 0
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "File Excel kosong atau sheet yang diharapkan tidak ditemukan. Pastikan sheet: locations, location_floor_prices, rooms, tenant_identities",
        }),
        { status: 400 }
      );
    }

    // Begin transaction
    await client.query("BEGIN");

    const summary = {
      locations: { inserted: 0, updated: 0, skipped: 0 },
      floors: { inserted: 0, updated: 0, skipped: 0 },
      rooms: { inserted: 0, updated: 0, skipped: 0 },
      tenants: { inserted: 0, updated: 0, skipped: 0 },
    };

    // --- 1) LOCATIONS ---
    // Expected columns (recommended): location_name, street_address, location_code, kelurahan, district, city, province, postal_code, longtitude, latitude
    const locationMap = new Map(); // key -> id; key prefer location_code else name lowercase
    if (locationsSheet.length > 0) {
      for (const r of locationsSheet) {
        const location_name =
          getCellValue(r, "location_name") || getCellValue(r, "name") || null;
        const street_address =
          getCellValue(r, "street_address") ||
          getCellValue(r, "address") ||
          null;
        const location_code =
          getCellValue(r, "location_code") || getCellValue(r, "code") || null;
        const kelurahan = getCellValue(r, "kelurahan") || null;
        const district = getCellValue(r, "district") || null;
        const city = getCellValue(r, "city") || null;
        const province = getCellValue(r, "province") || null;
        const postal_code =
          getCellValue(r, "postal_code") || getCellValue(r, "postal") || null;
        const longtitude =
          getCellValue(r, "longtitude") || getCellValue(r, "longitude") || null;
        const latitude = getCellValue(r, "latitude") || null;

        if (!location_name && !location_code) {
          summary.locations.skipped++;
          continue;
        }

        // Try find existing by location_code if provided else by name
        let existing = null;
        if (location_code) {
          const res = await client.query(
            "SELECT * FROM locations WHERE location_code = $1 LIMIT 1",
            [location_code]
          );
          existing = res.rows[0];
        }
        if (!existing && location_name) {
          const res = await client.query(
            "SELECT * FROM locations WHERE LOWER(location_name) = LOWER($1) LIMIT 1",
            [location_name]
          );
          existing = res.rows[0];
        }

        if (existing) {
          // Update record (optional) — here we update fields if provided
          await client.query(
            `UPDATE locations SET
              location_name = COALESCE($1, location_name),
              street_address = COALESCE($2, street_address),
              location_code = COALESCE($3, location_code),
              kelurahan = COALESCE($4, kelurahan),
              district = COALESCE($5, district),
              city = COALESCE($6, city),
              province = COALESCE($7, province),
              postal_code = COALESCE($8, postal_code),
              longtitude = COALESCE($9, longtitude),
              latitude = COALESCE($10, latitude)
            WHERE id = $11
            `,
            [
              location_name,
              street_address,
              location_code,
              kelurahan,
              district,
              city,
              province,
              postal_code,
              longtitude,
              latitude,
              existing.id,
            ]
          );
          locationMap.set(
            location_code || location_name.toLowerCase(),
            existing.id
          );
          summary.locations.updated++;
        } else {
          // Insert
          const ins = await client.query(
            `INSERT INTO locations
              (location_name, street_address, location_code, kelurahan, district, city, province, postal_code, longtitude, latitude)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING id`,
            [
              location_name,
              street_address,
              location_code,
              kelurahan,
              district,
              city,
              province,
              postal_code,
              longtitude,
              latitude,
            ]
          );
          const id = ins.rows[0].id;
          locationMap.set(
            location_code ||
              (location_name ? location_name.toLowerCase() : `id_${id}`),
            id
          );
          summary.locations.inserted++;
        }
      }
    }

    // --- 2) LOCATION FLOOR PRICES ---
    // Expected columns: location_code or location_name, floor, base_price
    const floorMap = new Map(); // composite key (locationId|floor) -> id
    if (floorsSheet.length > 0) {
      for (const r of floorsSheet) {
        const location_code =
          getCellValue(r, "location_code") || getCellValue(r, "code") || null;
        const location_name = getCellValue(r, "location_name") || null;
        const floor = getCellValue(r, "floor") || null;
        const base_price_raw =
          getCellValue(r, "base_price") || getCellValue(r, "price") || null;
        const base_price =
          base_price_raw !== null && base_price_raw !== ""
            ? Number(base_price_raw)
            : null;

        // find location id using map or query fallback
        let locationId = null;
        if (location_code && locationMap.has(location_code)) {
          locationId = locationMap.get(location_code);
        } else if (
          location_name &&
          locationMap.has(location_name.toLowerCase())
        ) {
          locationId = locationMap.get(location_name.toLowerCase());
        } else if (location_code) {
          // fallback query
          const res = await client.query(
            "SELECT id FROM locations WHERE location_code = $1 LIMIT 1",
            [location_code]
          );
          if (res.rowCount) {
            locationId = res.rows[0].id;
            locationMap.set(location_code, locationId);
          }
        } else if (location_name) {
          const res = await client.query(
            "SELECT id FROM locations WHERE LOWER(location_name) = LOWER($1) LIMIT 1",
            [location_name]
          );
          if (res.rowCount) {
            locationId = res.rows[0].id;
            locationMap.set(location_name.toLowerCase(), locationId);
          }
        }

        if (!locationId) {
          summary.floors.skipped++;
          continue;
        }
        if (!floor) {
          summary.floors.skipped++;
          continue;
        }

        // check existing floor price record for location+floor
        const resCheck = await client.query(
          `SELECT id FROM location_floor_prices WHERE location_id = $1 AND floor = $2 LIMIT 1`,
          [locationId, String(floor)]
        );
        if (resCheck.rowCount) {
          const id = resCheck.rows[0].id;
          // update if base_price provided
          if (base_price !== null) {
            await client.query(
              `UPDATE location_floor_prices SET base_price = $1 WHERE id = $2`,
              [base_price, id]
            );
            summary.floors.updated++;
          } else {
            summary.floors.skipped++;
          }
          floorMap.set(`${locationId}|${floor}`, id);
        } else {
          // insert
          if (base_price === null) {
            // require base_price to insert
            summary.floors.skipped++;
            continue;
          }
          const ins = await client.query(
            `INSERT INTO location_floor_prices (location_id, floor, base_price) VALUES ($1,$2,$3) RETURNING id`,
            [locationId, String(floor), base_price]
          );
          const id = ins.rows[0].id;
          floorMap.set(`${locationId}|${floor}`, id);
          summary.floors.inserted++;
        }
      }
    }

    // --- 3) ROOMS ---
    // Expected columns: location_code or location_name, room_number, floor (value matching floor), room_length, room_width, price_per_m2, status, notes
    if (roomsSheet.length > 0) {
      for (const r of roomsSheet) {
        const location_code = getCellValue(r, "location_code") || null;
        const location_name = getCellValue(r, "location_name") || null;
        const room_number =
          getCellValue(r, "room_number") || getCellValue(r, "room") || null;
        const floor = getCellValue(r, "floor") || null;
        const room_length_raw =
          getCellValue(r, "room_length") || getCellValue(r, "length") || null;
        const room_width_raw =
          getCellValue(r, "room_width") || getCellValue(r, "width") || null;
        const price_per_m2_raw =
          getCellValue(r, "price_per_m2") || getCellValue(r, "price") || null;
        const status = getCellValue(r, "status") || null;
        const notes = getCellValue(r, "notes") || null;

        const room_length =
          room_length_raw !== null && room_length_raw !== ""
            ? Number(room_length_raw)
            : null;
        const room_width =
          room_width_raw !== null && room_width_raw !== ""
            ? Number(room_width_raw)
            : null;
        const price_per_m2 =
          price_per_m2_raw !== null && price_per_m2_raw !== ""
            ? Number(price_per_m2_raw)
            : 0;

        // find location id
        let locationId = null;
        if (location_code && locationMap.has(location_code))
          locationId = locationMap.get(location_code);
        else if (location_name && locationMap.has(location_name.toLowerCase()))
          locationId = locationMap.get(location_name.toLowerCase());
        else if (location_code) {
          const res = await client.query(
            "SELECT id FROM locations WHERE location_code = $1 LIMIT 1",
            [location_code]
          );
          if (res.rowCount) {
            locationId = res.rows[0].id;
            locationMap.set(location_code, locationId);
          }
        } else if (location_name) {
          const res = await client.query(
            "SELECT id FROM locations WHERE LOWER(location_name) = LOWER($1) LIMIT 1",
            [location_name]
          );
          if (res.rowCount) {
            locationId = res.rows[0].id;
            locationMap.set(location_name.toLowerCase(), locationId);
          }
        }

        if (!locationId) {
          summary.rooms.skipped++;
          continue;
        }
        if (!room_number) {
          summary.rooms.skipped++;
          continue;
        }

        // Determine floor_id if floor provided
        let floorId = null;
        if (floor) {
          const key = `${locationId}|${String(floor)}`;
          if (floorMap.has(key)) {
            floorId = floorMap.get(key);
          } else {
            // fallback query: try find floor record under location
            const resf = await client.query(
              "SELECT id FROM location_floor_prices WHERE location_id = $1 AND floor = $2 LIMIT 1",
              [locationId, String(floor)]
            );
            if (resf.rowCount) {
              floorId = resf.rows[0].id;
              floorMap.set(key, floorId);
            }
          }
        }

        // check existing room by location_id + room_number
        const resCheck = await client.query(
          "SELECT * FROM rooms WHERE location_id = $1 AND room_number = $2 LIMIT 1",
          [locationId, room_number]
        );
        if (resCheck.rowCount) {
          // update existing
          const roomId = resCheck.rows[0].id;
          await client.query(
            `UPDATE rooms SET
               floor_id = COALESCE($1, floor_id),
               room_length = COALESCE($2, room_length),
               room_width = COALESCE($3, room_width),
               price_per_m2 = COALESCE($4, price_per_m2),
               status = COALESCE($5, status),
               notes = COALESCE($6, notes)
             WHERE id = $7
            `,
            [
              floorId,
              room_length,
              room_width,
              price_per_m2,
              status,
              notes,
              roomId,
            ]
          );
          summary.rooms.updated++;
        } else {
          // insert
          await client.query(
            `INSERT INTO rooms (location_id, room_number, floor_id, room_length, room_width, price_per_m2, status, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              locationId,
              room_number,
              floorId,
              room_length,
              room_width,
              price_per_m2,
              status || "available",
              notes,
            ]
          );
          summary.rooms.inserted++;
        }
      }
    }

    // --- 4) TENANT IDENTITIES ---
    // Expected columns: nik, full_name, ktp_file_path, birth_place, birth_date, nationality, religion, occupation, street_address, rt, rw, kelurahan, district, city, province, postal_code, phone, status, notes
    if (tenantsSheet.length > 0) {
      for (const r of tenantsSheet) {
        const nik = getCellValue(r, "nik") || null;
        const full_name =
          getCellValue(r, "full_name") || getCellValue(r, "name") || null;
        const ktp_file_path = getCellValue(r, "ktp_file_path") || null;
        const birth_place = getCellValue(r, "birth_place") || null;
        const birth_date_raw = getCellValue(r, "birth_date") || null;
        const birth_date = birth_date_raw ? new Date(birth_date_raw) : null;
        const nationality = getCellValue(r, "nationality") || null;
        const religion = getCellValue(r, "religion") || null;
        const occupation = getCellValue(r, "occupation") || null;
        const street_address = getCellValue(r, "street_address") || null;
        const rt = getCellValue(r, "rt") || null;
        const rw = getCellValue(r, "rw") || null;
        const kelurahan = getCellValue(r, "kelurahan") || null;
        const district = getCellValue(r, "district") || null;
        const city = getCellValue(r, "city") || null;
        const province = getCellValue(r, "province") || null;
        const postal_code = getCellValue(r, "postal_code") || null;
        const phone = getCellValue(r, "phone") || null;
        const status = getCellValue(r, "status") || "active";
        const notes = getCellValue(r, "notes") || null;

        if (!nik || !full_name) {
          summary.tenants.skipped++;
          continue;
        }

        // Upsert by nik
        const resCheck = await client.query(
          "SELECT id FROM tenant_identities WHERE nik = $1 LIMIT 1",
          [nik]
        );
        if (resCheck.rowCount) {
          const id = resCheck.rows[0].id;
          await client.query(
            `UPDATE tenant_identities SET
               full_name = COALESCE($1, full_name),
               ktp_file_path = COALESCE($2, ktp_file_path),
               birth_place = COALESCE($3, birth_place),
               birth_date = COALESCE($4, birth_date),
               nationality = COALESCE($5, nationality),
               religion = COALESCE($6, religion),
               occupation = COALESCE($7, occupation),
               street_address = COALESCE($8, street_address),
               rt = COALESCE($9, rt),
               rw = COALESCE($10, rw),
               kelurahan = COALESCE($11, kelurahan),
               district = COALESCE($12, district),
               city = COALESCE($13, city),
               province = COALESCE($14, province),
               postal_code = COALESCE($15, postal_code),
               phone = COALESCE($16, phone),
               status = COALESCE($17, status),
               notes = COALESCE($18, notes)
             WHERE id = $19
            `,
            [
              full_name,
              ktp_file_path,
              birth_place,
              birth_date,
              nationality,
              religion,
              occupation,
              street_address,
              rt,
              rw,
              kelurahan,
              district,
              city,
              province,
              postal_code,
              phone,
              status,
              notes,
              id,
            ]
          );
          summary.tenants.updated++;
        } else {
          // insert
          await client.query(
            `INSERT INTO tenant_identities
              (nik, full_name, ktp_file_path, birth_place, birth_date, nationality, religion, occupation,
               street_address, rt, rw, kelurahan, district, city, province, postal_code, phone, status, notes)
             VALUES
              ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
            `,
            [
              nik,
              full_name,
              ktp_file_path,
              birth_place,
              birth_date,
              nationality,
              religion,
              occupation,
              street_address,
              rt,
              rw,
              kelurahan,
              district,
              city,
              province,
              postal_code,
              phone,
              status,
              notes,
            ]
          );
          summary.tenants.inserted++;
        }
      }
    }

    // Commit transaction
    await client.query("COMMIT");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Import selesai",
        summary,
      }),
      { status: 200 }
    );
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Import error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message || "Kesalahan saat import",
      }),
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
