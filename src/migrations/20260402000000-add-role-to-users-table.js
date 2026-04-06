exports.up = (pgm) => {
  pgm.addColumn("users", {
    role: {
      type: "varchar(50)",
      notNull: true,
      default: "operator",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("users", "role");
};
