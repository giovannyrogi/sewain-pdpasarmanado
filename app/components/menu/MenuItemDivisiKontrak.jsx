import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Icon } from "@iconify/react";

const menuDevisiKontrak = [
  {
    label: "Dashboard",
    value: "dashboard",
    path: "/divisi-kontrak/dashboard",
    icon: <Icon icon="svg-spinners:blocks-scale" fontSize="20px" />,
  },
  {
    label: "Data Master",
    value: "dataMaster",
    icon: <Icon icon="material-symbols:database" fontSize="20px" />,
    submenu: [
      {
        label: "Locations",
        value: "locations",
        path: "/divisi-kontrak/locations",
        icon: <Icon icon="mdi:location-radius-outline" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Floor Prices",
        value: "floor-prices",
        path: "/divisi-kontrak/floor-prices",
        icon: <Icon icon="ion:pricetags-outline" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Rooms",
        value: "rooms",
        path: "/divisi-kontrak/rooms",
        icon: <Icon icon="cil:room" fontSize="20px" />,
        showIcon: true,
      },
    ],
  },
  {
    label: "Transactions",
    value: "transactions",
    icon: <Icon icon="healthicons:money-bag" fontSize="20px" />,
    submenu: [
      {
        label: "Tenant Application",
        value: "tenant-application",
        path: "/divisi-kontrak/tenant-application",
        icon: <Icon icon="hugeicons:file-edit" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Payments",
        value: "payments",
        path: "/divisi-kontrak/payments",
        icon: (
          <Icon icon="streamline-freehand:money-atm-withdraw" fontSize="20px" />
        ),
        showIcon: true,
      },
      {
        label: "Contracts",
        value: "contracts",
        path: "/divisi-kontrak/contracts",
        icon: <Icon icon="clarity:contract-line" fontSize="20px" />,
        showIcon: true,
      },
    ],
  },
];

export default menuDevisiKontrak;
