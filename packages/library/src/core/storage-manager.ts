import { Experiment, User, Variant } from "src/types";
import { STORAGE_KEY_PREFIX } from "@/lib/constants";
import { storedVariantsSchema } from "@/schemas";

export class StorageManager {
  private storage: Storage;
  private prefix = STORAGE_KEY_PREFIX;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  public setUser(user: User): void {
    this.storage.setItem(`${this.prefix}user`, JSON.stringify(user));
  }

  public getUser(): User | null {
    const userData = this.storage.getItem(`${this.prefix}user`);
    return userData ? JSON.parse(userData) : null;
  }

  public setVariant(experimentKey: Experiment["key"], variant: Variant) {
    let variants = this.getVariants();
    if (!variants) variants = {};
    variants[experimentKey] = variant;

    this.storage.setItem(`${this.prefix}variants`, JSON.stringify(variants));
  }

  public getVariant(experimentKey: Experiment["key"]) {
    const variants = this.getVariants();
    if (!variants) return null;

    return variants[experimentKey];
  }

  private getVariants() {
    const variantsData = this.storage.getItem(`${this.prefix}variants`);
    if (!variantsData) return null;

    const parsedVariants = storedVariantsSchema.safeParse(
      JSON.parse(variantsData),
    );

    if (!parsedVariants.success) {
      return null;
    }

    return parsedVariants.data;
  }

  public setDeviceId(deviceId: string) {
    this.storage.setItem(`${this.prefix}deviceId`, deviceId);
  }

  public getDeviceId() {
    const deviceId = this.storage.getItem(`${this.prefix}deviceId`);
    return deviceId ? deviceId : null;
  }
}
