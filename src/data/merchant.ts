export type MerchantProfile = {
  id: string;
  name: string;
  /** Synthetic demo record; not a real merchant. */
  isDemo: true;
};

export const merchant: MerchantProfile = {
  id: "demo-merchant-001",
  name: "Sri Murugan Stores",
  isDemo: true,
};
