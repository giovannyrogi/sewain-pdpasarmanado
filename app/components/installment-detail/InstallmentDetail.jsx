import { Divider, Grid, Typography, useTheme } from "@mui/material";
import formatRupiah from "../formatrupiah/page";

const InstallmentDetail = ({
  title,
  totalPayment,
  contractAmount,
  ppnAmount,
  totalInstallment,
  remainingBalance,
  paymentNumber = "none",
}) => {
  const theme = useTheme();

  return (
    <Grid container>
      <Grid mt={1}>
        <Typography sx={{ fontSize: 16, fontWeight: "bold" }}>
          {title}
        </Typography>
      </Grid>

      <Divider
        sx={{
          mb: 0.5,
          borderColor: theme.palette.primary.main,
          width: "100%",
        }}
      />

      <Grid container size={12} spacing={0.2}>
        {[
          {
            label:
              paymentNumber === "DP" ? "Uang Muka (DP)" : "Total Pembayaran",
            value: totalPayment,
          },
          { label: "Nilai Kontrak", value: contractAmount },
          { label: "PPN (11%)", value: ppnAmount },
        ].map((item, idx) => (
          <Grid
            key={idx}
            size={12}
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Typography sx={{ fontWeight: "bold", fontSize: "13px" }}>
              {item.label}
            </Typography>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: "13px",
                wordBreak: "break-word",
                whiteSpace: "normal",
                overflowWrap: "anywhere",
              }}
            >
              {item.value ? formatRupiah(item.value) : "-"}
            </Typography>
          </Grid>
        ))}
      </Grid>

      <Divider
        sx={{
          mb: 0.5,
          mt: 0.5,
          borderColor: theme.palette.primary.main,
          width: "100%",
        }}
      />

      {/* Total Pembayaran */}
      <Grid container size={12} spacing={1}>
        <Grid
          size={12}
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontWeight: "bold", fontSize: "13px" }}>
            {paymentNumber === "DP" ? "Total Pembayaran" : "Total Cicilan"}
          </Typography>
          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: "13px",
              wordBreak: "break-word",
              whiteSpace: "normal",
              overflowWrap: "anywhere",
            }}
          >
            {totalInstallment ? formatRupiah(totalInstallment) : "-"}
          </Typography>
        </Grid>
      </Grid>

      <Divider
        sx={{
          mb: 0.5,
          mt: 0.5,
          borderColor: theme.palette.primary.main,
          width: "100%",
        }}
      />

      <Grid
        size={12}
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography sx={{ fontWeight: "bold", fontSize: "13px" }}>
          Sisa Tagihan
        </Typography>
        <Typography
          sx={{
            fontWeight: "bold",
            fontSize: "13px",
            wordBreak: "break-word",
            whiteSpace: "normal",
            overflowWrap: "anywhere",
          }}
        >
          {remainingBalance ? formatRupiah(remainingBalance) : "-"}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default InstallmentDetail;
