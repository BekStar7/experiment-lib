import { StorageManager } from "@/core/storage-manager";
import { STORAGE_KEY_PREFIX } from "@/lib/constants";
import { User, Variant } from "@/types";
import * as schemas from "@/schemas";

jest.mock("@/schemas", () => ({
  storedVariantsSchema: {
    safeParse: jest.fn(),
  },
}));

describe("StorageManager", () => {
  let storageManager: StorageManager;
  let mockStorage: {
    getItem: jest.Mock;
    setItem: jest.Mock;
    removeItem: jest.Mock;
    clear: jest.Mock;
    length: number;
    key: jest.Mock;
  };
  const prefix = STORAGE_KEY_PREFIX;

  beforeEach(() => {
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    };

    storageManager = new StorageManager(mockStorage);
  });

  describe("setUser", () => {
    it("should store user data in storage", () => {
      const mockUser: User = {
        id: "user-123",
        device_id: "test-device-id",
        email: "test@example.com",
        external_id: "test-external-id",
      };

      storageManager.setUser(mockUser);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        `${prefix}user`,
        JSON.stringify(mockUser),
      );
    });
  });

  describe("getUser", () => {
    it("should return user data from storage", () => {
      const mockUser: User = {
        id: "user-123",
        device_id: "test-device-id",
        email: "test@example.com",
        external_id: "test-external-id",
      };

      mockStorage.getItem.mockReturnValueOnce(JSON.stringify(mockUser));

      const result = storageManager.getUser();

      expect(mockStorage.getItem).toHaveBeenCalledWith(`${prefix}user`);
      expect(result).toEqual(mockUser);
    });

    it("should return null if no user data exists", () => {
      mockStorage.getItem.mockReturnValueOnce(null);

      const result = storageManager.getUser();

      expect(result).toBeNull();
    });
  });

  describe("setVariant", () => {
    it("should add a variant to existing variants", () => {
      const experimentKey = "test-experiment";
      const mockVariant: Variant = {
        id: "var-123",
        key: "A",
        payload: { title: "Variant A" },
      };

      const existingVariants = {
        "other-experiment": {
          id: "var-456",
          key: "B",
          payload: { title: "Variant B" },
        },
      };

      mockStorage.getItem.mockReturnValueOnce(JSON.stringify(existingVariants));
      (schemas.storedVariantsSchema.safeParse as jest.Mock).mockReturnValueOnce(
        {
          success: true,
          data: existingVariants,
        },
      );

      storageManager.setVariant(experimentKey, mockVariant);

      const expectedVariants = {
        ...existingVariants,
        [experimentKey]: mockVariant,
      };

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        `${prefix}variants`,
        JSON.stringify(expectedVariants),
      );
    });

    it("should create a new variants object if none exists", () => {
      const experimentKey = "test-experiment";
      const mockVariant: Variant = {
        id: "var-123",
        key: "A",
        payload: { title: "Variant A" },
      };

      mockStorage.getItem.mockReturnValueOnce(null);

      storageManager.setVariant(experimentKey, mockVariant);

      const expectedVariants = {
        [experimentKey]: mockVariant,
      };

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        `${prefix}variants`,
        JSON.stringify(expectedVariants),
      );
    });
  });

  describe("getVariant", () => {
    it("should return a specific variant from storage", () => {
      const experimentKey = "test-experiment";
      const mockVariant: Variant = {
        id: "var-123",
        key: "A",
        payload: { title: "Variant A" },
      };

      const storedVariants = {
        [experimentKey]: mockVariant,
        "other-experiment": {
          id: "var-456",
          key: "B",
          payload: { title: "Variant B" },
        },
      };

      mockStorage.getItem.mockReturnValueOnce(JSON.stringify(storedVariants));
      (schemas.storedVariantsSchema.safeParse as jest.Mock).mockReturnValueOnce(
        {
          success: true,
          data: storedVariants,
        },
      );

      const result = storageManager.getVariant(experimentKey);

      expect(mockStorage.getItem).toHaveBeenCalledWith(`${prefix}variants`);
      expect(result).toEqual(mockVariant);
    });

    it("should return null or undefined if the variant does not exist", () => {
      const experimentKey = "non-existent-experiment";

      const storedVariants = {
        "test-experiment": {
          id: "var-123",
          key: "A",
          payload: { title: "Variant A" },
        },
      };

      mockStorage.getItem.mockReturnValueOnce(JSON.stringify(storedVariants));
      (schemas.storedVariantsSchema.safeParse as jest.Mock).mockReturnValueOnce(
        {
          success: true,
          data: storedVariants,
        },
      );

      const result = storageManager.getVariant(experimentKey);

      expect(result).toBeFalsy();
    });

    it("should return null if variants parsing fails", () => {
      const experimentKey = "test-experiment";

      mockStorage.getItem.mockReturnValueOnce(JSON.stringify(undefined));
      (schemas.storedVariantsSchema.safeParse as jest.Mock).mockReturnValueOnce(
        {
          success: false,
          error: new Error("Invalid format"),
        },
      );

      const result = storageManager.getVariant(experimentKey);

      expect(result).toBeNull();
    });
  });

  describe("setDeviceId and getDeviceId", () => {
    it("should store and retrieve device ID", () => {
      const deviceId = "test-device-id-123";

      storageManager.setDeviceId(deviceId);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        `${prefix}deviceId`,
        deviceId,
      );

      mockStorage.getItem.mockReturnValueOnce(deviceId);

      const result = storageManager.getDeviceId();

      expect(mockStorage.getItem).toHaveBeenCalledWith(`${prefix}deviceId`);
      expect(result).toBe(deviceId);
    });

    it("should return null if no device ID exists", () => {
      mockStorage.getItem.mockReturnValueOnce(null);

      const result = storageManager.getDeviceId();

      expect(result).toBeNull();
    });
  });
});
