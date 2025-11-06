import { Icon } from "@iconify/react";

const settingsMenu = [
  {
    label: "Settings",
    value: "settings",
    icon: <Icon icon="line-md:cog-filled-loop" fontSize={22} />, // Ganti dengan icon yang kamu suka
    submenu: [
      {
        label: "Account",
        value: "account",
        path: "/settings/account",
        icon: <Icon icon="mdi:account-edit" fontSize="20px" />,
        showIcon: true,
      },
      // {
      //   label: "Database",
      //   value: "database",
      //   path: "/settings/database",
      //   icon: <Icon icon="material-symbols:database" fontSize="20px" />,
      //   showIcon: true,
      // },
      // {
      //   label: "Theme",
      //   value: "theme",
      //   showIcon: false,
      //   icon: <Icon icon="mdi:theme-light-dark" fontSize={20} />,
      // },
    ],
  },
];

export default settingsMenu;
