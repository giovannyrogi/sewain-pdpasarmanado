export const getMenusByRole = (menus, roleId) => {
  return menus
    .filter((menu) => menu.roles.includes(roleId))
    .map((menu) => ({
      ...menu,
      children: menu.children
        ? menu.children.filter((sub) => sub.roles.includes(roleId))
        : undefined,
    }));
};
