const { registerSchema, loginSchema, updateUserSchema, assignRoleSchema } = require('../../src/validations/user-validation');

describe('Validation: user-validation', () => {
  describe('registerSchema', () => {
    it('should validate correct data', () => {
      const { error } = registerSchema.validate({ name: 'John', email: 'john@test.com', password: 'password123' });
      expect(error).toBeUndefined();
    });
    it('should fail if email is invalid', () => {
      const { error } = registerSchema.validate({ name: 'John', email: 'invalidemail', password: 'password123' });
      expect(error).toBeDefined();
    });
  });

  describe('loginSchema', () => {
    it('should validate correct data', () => {
      const { error } = loginSchema.validate({ email: 'john@test.com', password: 'password123' });
      expect(error).toBeUndefined();
    });
    it('should fail if password is missing', () => {
      const { error } = loginSchema.validate({ email: 'john@test.com' });
      expect(error).toBeDefined();
    });
  });

  describe('updateUserSchema', () => {
    it('should validate correct optional data', () => {
      const { error } = updateUserSchema.validate({ name: 'Jane' });
      expect(error).toBeUndefined();
    });
  });

  describe('assignRoleSchema', () => {
    it('should validate integer role_id', () => {
      const { error } = assignRoleSchema.validate({ role_id: 1 });
      expect(error).toBeUndefined();
    });
    it('should fail if role_id is not integer', () => {
      const { error } = assignRoleSchema.validate({ role_id: 'admin' });
      expect(error).toBeDefined();
    });
  });
});
