import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ProfileData } from "../types";

// Zustand 스토어에서 사용할 상태의 타입
interface FormState extends ProfileData {
  setProfileData: (data: Partial<ProfileData>) => void;
  resetForm: () => void;
}

// 폼 필드의 초기 상태
const initialState: Omit<ProfileData, "id" | "overrides"> = {
  name: "",
  familyMembers: [],
  dob: "",
  retirementAge: 65,
  monthlyIncomes: Array.from({ length: 12 }, (_, i) => ({
    id: `${i}`,
    month: i + 1,
    income: 0,
    bonus: 0,
  })),
  loans: [
    {
      id: "0",
      name: "",
      type: "",
      principal: 0,
      interestRate: 0,
      termInYears: 0,
      paymentMethod: ""
    },
  ],
  realEstateAssets: [],
  peakWagePeriod: 5,
  peakWageReductionRate: 20,
  monthlyRepayment: 0,
  monthlySavings: 0,
  monthlyInsurance: 0,
  consumptionType: "AMOUNT",
  monthlyConsumptionValue: 0,
  salaryInflationRate: 2,
  projectedData: [],
};

export const useFormStore = create<FormState>()(
  devtools(
    persist(
      (set) => ({
        id: "", // ❗️ 여기에 id의 초기값을 추가합니다.
        ...initialState,
        setProfileData: (data) => set((state) => ({ ...state, ...data })),
        resetForm: () => set({ id: "", ...initialState }), // reset 할 때도 id를 초기화합니다.
      }),
      { name: "rofle-form-storage" }
    )
  )
);
