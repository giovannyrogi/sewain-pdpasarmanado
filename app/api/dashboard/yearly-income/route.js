import pool from "@/lib/dbConfig";
import moment from "moment";

export async function GET() {
  try {
    const currentYear = moment().year();
    const currentMonth = moment().month() + 1; // 1–12

    // === Query data pendapatan TANPA pajak ===
    const incomeWithTaxQuery = `
      SELECT
        EXTRACT(MONTH FROM payment_date) AS month,
        EXTRACT(YEAR FROM payment_date) AS year,
        SUM(amount) AS total_with_tax
      FROM payments
      WHERE approval_status = 'approved'
        AND amount IS NOT NULL
        AND EXTRACT(YEAR FROM payment_date) = $1
      GROUP BY year, month
      ORDER BY month ASC;
    `;

    // === Query data pendapatan DENGAN pajak ===
    const incomeWithoutTaxQuery = `
      SELECT
        EXTRACT(MONTH FROM payment_date) AS month,
        EXTRACT(YEAR FROM payment_date) AS year,
        SUM(amount - COALESCE(ppn_amount, 0)) AS total_without_tax
      FROM payments
      WHERE approval_status = 'approved'
        AND amount IS NOT NULL
        AND EXTRACT(YEAR FROM payment_date) = $1
      GROUP BY year, month
      ORDER BY month ASC;
    `;

    const [withoutTaxResult, withTaxResult] = await Promise.all([
      pool.query(incomeWithoutTaxQuery, [currentYear]),
      pool.query(incomeWithTaxQuery, [currentYear]),
    ]);

    // Buat array 12 bulan (1–12)
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    // Mapping hasil ke bentuk array JSON per bulan
    const monthlyData = months.map((m) => {
      const withTax =
        withTaxResult.rows.find(
          (r) => parseInt(r.month) === m && parseInt(r.year) === currentYear
        )?.total_with_tax || 0;

      const withoutTax =
        withoutTaxResult.rows.find(
          (r) => parseInt(r.month) === m && parseInt(r.year) === currentYear
        )?.total_without_tax || 0;

      return {
        month_number: m,
        month_name: moment(`${currentYear}-${m}`, "YYYY-M").format("MMM"),
        total_with_tax: parseFloat(withTax),
        total_without_tax: parseFloat(withoutTax),
      };
    });

    // === Response ===
    return new Response(
      JSON.stringify({
        success: true,
        message: `Berhasil mengambil data pendapatan Januari sampai ${moment().format(
          "MMMM"
        )} ${currentYear}`,
        data: monthlyData,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching yearly income:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      { status: 500 }
    );
  }
}
