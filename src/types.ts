// src/types.ts

export interface FamilyMember {
  name: string;
  age: number;
  relationship: string;
}

// 서버에서 받아오는 원본 데이터 타입
export interface ProfileData {
  id: string;
  dob: string;
  name: string;
  familyMembers: FamilyMember[];
  retirementAge: number;
  monthlyIncomes: {
    id: string;
    month: number;
    income: number;
    bonus: number;
  }[];
  loans: Loan[];
  realEstateAssets: { id: string; name: string; currentValue: number }[];
  peakWagePeriod?: number;
  peakWageReductionRate?: number;
  monthlyRepayment?: number;
  monthlySavings?: number;
  monthlyInsurance?: number;
  consumptionType?: "AMOUNT" | "PERCENTAGE";
  monthlyConsumptionValue?: number;
  salaryInflationRate?: number;
  overrides?: { [year: string]: { [month: string]: Partial<MonthlyData> } };
  projectedData: ProjectedData[];
}

export interface ProjectedData {
  id: string;
  year: number;
  month: number;
  income: number | null;
  monthlyConsumption: number | null;
  isOverridden: boolean;
  profileId: string;
}

// 시뮬레이션 결과로 생성되는 월별 데이터 타입
export interface MonthlyData {
  year: number;
  month: number;
  income: number;
  bonus: number;
  loanInterestPaid: number;
  loanPrincipalPaid: number;
  totalLoanPayment: number;
  monthlyConsumption: number;
  cumulativeSavings: number;
  remainingLoanPrincipal: number;
  disposableIncome: number;
  isOverridden: boolean;
  realEstateValue: number;
  totalAssets: number;
}

// 시뮬레이션 최종 요약 타입
export interface ProjectionSummary {
  retirementYear: number;
  finalAssets: number;
  finalLiabilities: number;
  totalInterestPaid: number;
  finalSavings: number;
  finalRealEstateValue: number;
}

// 전체 예측 데이터 타입
export interface ProjectionData {
  projection: MonthlyData[];
  summary: ProjectionSummary;
}

export interface LoanState {
  id: string;
  principal: number;
  interestRate: number;
}

export interface RealEstateState {
  name: string;
  value: number;
}

export interface MonthlyIncome {
  id: string;
  month: number;
  income: number;
  bonus: number;
}

export type Loan = {
  id: string;
  name: string;
  type: string;
  principal: number;
  interestRate: number;
  termInYears: number;
  gracePeriodInYears?: number;
  paymentMethod: string;
};

export interface RealEstateAsset {
  id: string;
  name: string;
  currentValue: number;
}
