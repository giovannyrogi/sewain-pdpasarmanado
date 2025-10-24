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
  {
    label: "Reports",
    value: "reports",
    icon: <Icon icon="fluent:chart-multiple-16-filled" fontSize={23} />,
    submenu: [
      {
        label: "Report By Locations",
        value: "locations-report",
        path: "/divisi-keuangan/locations-report",
        icon: <Icon icon="ant-design:pie-chart-filled" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Report By Tenants",
        value: "tenants-report",
        path: "/divisi-keuangan/tenants-report",
        icon: <Icon icon="bi:bar-chart-fill" fontSize="18px" />,
        showIcon: true,
      },
    ],
  },
];

export default menuDivisiKeuangan;
