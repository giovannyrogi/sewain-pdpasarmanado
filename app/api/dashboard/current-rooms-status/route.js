import pool from "@/lib/dbConfig";

export async function GET() {
  try {
    const sql = `
      SELECT 
        status,
        COUNT(*) AS total
      FROM rooms
      GROUP BY status
    `;

    const result = await pool.query(sql);

    // Bentuk default agar jika salah satu status tidak ada, tetap muncul di response
    const defaultData = {
      available: 0,
      occupied: 0,
      unavailable: 0,
      maintenance: 0,
    };

    // Mapping hasil query ke object di atas
    result.rows.forEach((row) => {
      const key = row.status;
      if (key && defaultData.hasOwnProperty(key)) {
        defaultData[key] = parseInt(row.total, 10);
      }
    });

    // Bentuk response data yang dikirim ke frontend
    const responseData = {
      available: defaultData.available,
      occupied: defaultData.occupied,
      unavailable: defaultData.unavailable,
      maintenance: defaultData.maintenance,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil status kontrak tenant",
        data: responseData,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("error", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal mengambil data status room",
        error: err.message,
      }),
      { status: 500 }
    );
  }
}
