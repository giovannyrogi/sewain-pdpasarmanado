import pool from "@/lib/dbConfig";
import moment from "moment";

export async function GET(req) {
  try {
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();
    const lastMonth = moment().subtract(1, "month").month() + 1;
    const lastMonthYear = moment().subtract(1, "month").year();

    // === 1. Query ambil data TANPA pajak ===
    // SUM(amount), nanti dikurangi 50.000 setelah total dijumlahkan
    const incomeWithoutTaxQuery = `
      SELECT
        EXTRACT(MONTH FROM payment_date) AS month,
        EXTRACT(YEAR FROM payment_date) AS year,
        SUM(amount) AS total_without_tax
      FROM payments
      WHERE approval_status = 'approved'
        AND amount IS NOT NULL
      GROUP BY year, month
      ORDER BY year DESC, month DESC;
    `;

    // === 2. Query ambil data DENGAN pajak ===
    // SUM(amount - ppn_amount), nanti dikurangi 50.000 setelah total dijumlahkan
    const incomeWithTaxQuery = `
      SELECT
        EXTRACT(MONTH FROM payment_date) AS month,
        EXTRACT(YEAR FROM payment_date) AS year,
        SUM(amount - COALESCE(ppn_amount, 0)) AS total_with_tax
      FROM payments
      WHERE approval_status = 'approved'
        AND amount IS NOT NULL
      GROUP BY year, month
      ORDER BY year DESC, month DESC;
    `;

    const [withoutTaxResult, withTaxResult] = await Promise.all([
      pool.query(incomeWithoutTaxQuery),
      pool.query(incomeWithTaxQuery),
    ]);

    let currentMonthWithTax = 0;
    let lastMonthWithTax = 0;
    let currentMonthWithoutTax = 0;
    let lastMonthWithoutTax = 0;

    // === 3. Ambil total bulan ini & bulan lalu ===
    withTaxResult.rows.forEach((row) => {
      const rowMonth = parseInt(row.month);
      const rowYear = parseInt(row.year);
      if (rowYear === currentYear && rowMonth === currentMonth)
        currentMonthWithTax = parseFloat(row.total_with_tax) || 0;
      if (rowYear === lastMonthYear && rowMonth === lastMonth)
        lastMonthWithTax = parseFloat(row.total_with_tax) || 0;
    });

    withoutTaxResult.rows.forEach((row) => {
      const rowMonth = parseInt(row.month);
      const rowYear = parseInt(row.year);
      if (rowYear === currentYear && rowMonth === currentMonth)
        currentMonthWithoutTax = parseFloat(row.total_without_tax) || 0;
      if (rowYear === lastMonthYear && rowMonth === lastMonth)
        lastMonthWithoutTax = parseFloat(row.total_without_tax) || 0;
    });

    // === 4. Hitung selisih dan persentase ===
    const differenceWithTax = Math.abs(currentMonthWithTax - lastMonthWithTax);
    const differenceWithoutTax = Math.abs(
      currentMonthWithoutTax - lastMonthWithoutTax
    );

    const percentageWithTax =
      lastMonthWithTax > 0
        ? parseFloat(((differenceWithTax / lastMonthWithTax) * 100).toFixed(2))
        : 0;

    const percentageWithoutTax =
      lastMonthWithoutTax > 0
        ? parseFloat(
            ((differenceWithoutTax / lastMonthWithoutTax) * 100).toFixed(2)
          )
        : 0;

    // === 5. Tentukan trend (up | down | equal) ===
    const trendWithTax =
      currentMonthWithTax > lastMonthWithTax
        ? "up"
        : currentMonthWithTax < lastMonthWithTax
        ? "down"
        : "equal";

    const trendWithoutTax =
      currentMonthWithoutTax > lastMonthWithoutTax
        ? "up"
        : currentMonthWithoutTax < lastMonthWithoutTax
        ? "down"
        : "equal";

    // === 7. Kirim ke frontend ===
    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil total pendapatan 2 bulan terakhir",
        data: {
          with_tax: {
            current_month: {
              month: moment().format("MMMM YYYY"),
              total_income: currentMonthWithTax,
            },
            last_month: {
              month: moment().subtract(1, "month").format("MMMM YYYY"),
              total_income: lastMonthWithTax,
            },
            difference: differenceWithTax,
            percentage_change: percentageWithTax,
            trend: trendWithTax,
          },
          without_tax: {
            current_month: {
              month: moment().format("MMMM YYYY"),
              total_income: currentMonthWithoutTax,
            },
            last_month: {
              month: moment().subtract(1, "month").format("MMMM YYYY"),
              total_income: lastMonthWithoutTax,
            },
            difference: differenceWithoutTax,
            percentage_change: percentageWithoutTax,
            trend: trendWithoutTax,
          },
        },
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching income data:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      { status: 500 }
    );
  }
}
