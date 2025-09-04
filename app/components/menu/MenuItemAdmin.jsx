import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Icon } from "@iconify/react";

const menuAdmin = [
  {
    label: "Dashboard",
    value: "dashboard",
    path: "/admin/dashboard",
    icon: <Icon icon="svg-spinners:blocks-scale" fontSize="20px" />,
  },
  {
    label: "Data Master",
    value: "dataMaster",
    icon: <Icon icon="material-symbols:database" fontSize={20} />,
    submenu: [
      {
        label: "Locations",
        value: "locations",
        path: "/admin/locations",
        icon: <Icon icon="mdi:location-radius-outline" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Users",
        value: "users",
        path: "/admin/users",
        icon: <Icon icon="streamline-plump:user-pin" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Devices",
        value: "devices",
        path: "/admin/devices",
        icon: <Icon icon="streamline-freehand:mobile-phone-smartphone" fontSize="20px" />,
        showIcon: true,
      },
    ],
  },
  // Tambahkan menu lain sesuai kebutuhan admin
];

export default menuAdmin;
