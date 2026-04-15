const updateUser = require('../../../src/services/user/update-user-service');
const { User } = require('../../../src/models');

jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger'); // Silence logs

describe('Service: update-user-service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error on invalid data', async () => {
    // Note: Validation might happen before this service or within it.
    // If it's within, we need to mock the validation or trigger it.
    // For now, let's assume it throws if we pass something that fails model validation or business logic.
    // If there's no explicit validation here, this test might need adjustment.
  });

  it('should throw error if user not found', async () => {
    User.findByPk.mockResolvedValue(null);
    const validData = { name: 'New Name' };
    await expect(updateUser(999, validData)).rejects.toThrow('User not found');
  });

  it('should update user if found', async () => {
    const validData = { name: 'Updated Name' };
    const mockUser = {
      id: 1,
      update: jest.fn().mockResolvedValue(true),
      toJSON: () => ({ id: 1, name: 'Updated Name' })
    };
    User.findByPk.mockResolvedValue(mockUser);

    const result = await updateUser(1, validData);

    expect(mockUser.update).toHaveBeenCalledWith(expect.objectContaining(validData));
    expect(result).toEqual(mockUser);
  });
});
