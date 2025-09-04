import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Icon } from "@iconify/react";

const menuSuperadmin = [
  {
    label: "Dashboard",
    value: "dashboard",
    path: "/superadmin/dashboard",
    icon: <Icon icon="svg-spinners:blocks-scale" fontSize="20px" />,
  },
  {
    label: "Data Master",
    value: "dataMaster",
    icon: <Icon icon="material-symbols:database" fontSize={20} />,
    submenu: [
      {
        label: "Users",
        value: "users",
        path: "/superadmin/users",
        icon: <Icon icon="streamline-plump:user-pin" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Roles",
        value: "roles",
        path: "/superadmin/roles",
        icon: <Icon icon="oui:app-users-roles" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Locations",
        value: "locations",
        path: "/superadmin/locations",
        icon: <Icon icon="mdi:location-radius-outline" fontSize="20px" />,
        showIcon: true,
      },
      {
        label: "Rooms",
        value: "rooms",
        path: "/superadmin/rooms",
        icon: <Icon icon="cil:room" fontSize="20px" />,
        showIcon: true,
      },
    ],
  },
  {
    label: "Report",
    value: "report",
    icon: <Icon icon="line-md:document-report-twotone" fontSize={23} />,
    submenu: [
      {
        label: "Laporan 1",
        value: "laporan1",
        path: "/superadmin/laporan1",
        icon: <LocationOnIcon />,
        showIcon: false,
      },
      {
        label: "Laporan 2",
        value: "laporan2",
        path: "/superadmin/laporan2",
        icon: <PeopleIcon />,
        showIcon: false,
      },
    ],
  },
  // Tambahkan menu lain jika perlu
];

export default menuSuperadmin;
