import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Icon } from "@iconify/react";

const menuDivisiKeuangan = [
  {
    label: "Dashboard",
    value: "dashboard",
    path: "/divisi-keuangan/dashboard",
    icon: <Icon icon="svg-spinners:blocks-scale" fontSize="20px" />,
  },
  {
    label: "Transactions",
    value: "transactions",
    icon: <Icon icon="healthicons:money-bag" fontSize="20px" />,
    submenu: [
      {
        label: "Payments",
        value: "payments",
        path: "/divisi-keuangan/payments",
        icon: (
          <Icon icon="streamline-freehand:money-atm-withdraw" fontSize="20px" />
        ),
        showIcon: true,
      },
    ],
  },
];

export default menuDivisiKeuangan;
