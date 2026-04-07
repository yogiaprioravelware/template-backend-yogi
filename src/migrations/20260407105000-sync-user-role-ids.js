/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Sync admin role_id based on 'admin' name in roles table
  pgm.sql(`
    UPDATE users 
    SET role_id = (SELECT id FROM roles WHERE name = 'admin') 
    WHERE role = 'admin'
  `);

  // Sync operator role_id based on 'operator' name in roles table
  pgm.sql(`
    UPDATE users 
    SET role_id = (SELECT id FROM roles WHERE name = 'operator') 
    WHERE role = 'operator'
  `);
};

exports.down = (pgm) => {
  // Revert role_id to null
  pgm.sql("UPDATE users SET role_id = NULL");
};
