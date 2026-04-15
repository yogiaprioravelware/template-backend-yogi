const StagingAuditLog = require("../../src/models/StagingAuditLog");

describe("Model: StagingAuditLog", () => {
  it("should correctly stringify and parse the details JSON", () => {
    // We access the raw model definition's getter and setter
    // Since we can't easily instantiate a real Sequelize model without a DB in a pure unit test,
    // we use the data values simulation pattern.
    
    const mockData = {
      details: null
    };

    const instance = {
      getDataValue: (key) => mockData[key],
      setDataValue: (key, value) => { mockData[key] = value; }
    };

    // Get the getter and setter from the model definition
    const detailsAttr = StagingAuditLog.rawAttributes.details;
    
    // Test Setter
    const testData = { item: "RFID-123", action: "PICK" };
    detailsAttr.set.call(instance, testData);
    expect(mockData.details).toBe(JSON.stringify(testData));

    // Test Getter
    const parsedData = detailsAttr.get.call(instance);
    expect(parsedData).toEqual(testData);

    // Test Null Case
    detailsAttr.set.call(instance, null);
    expect(mockData.details).toBeNull();
    expect(detailsAttr.get.call(instance)).toBeNull();
  });
});
