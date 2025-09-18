// src/lib/projectionEngine.tsx
import type {
  MonthlyData,
  LoanState,
  RealEstateState,
  ProfileData,
} from "../types";

/**
 * 프로필 데이터를 기반으로 미래 재무 상황을 예측하여 반환합니다.
 * @param profileData 예측을 생성할 사용자의 전체 프로필 데이터
 * @returns {{projection: MonthlyData[], summary: object}} 월별 예측 데이터 배열과 최종 요약 객체
 */
export const generateProjection = (profileData: ProfileData) => {
  const profile = profileData;

  if (!profile || !profile.dob || !profile.retirementAge) {
    throw new Error(
      "예측에 필요한 필수 프로필 정보(생년월일, 정년)가 없습니다."
    );
  }

  const today = new Date();
  const retirementYear =
    new Date(profile.dob).getFullYear() + profile.retirementAge;
  const currentUserAge =
    today.getFullYear() - new Date(profile.dob).getFullYear();

  const SALARY_INFLATION_RATE = profile.salaryInflationRate || 0.02;
  const REAL_ESTATE_APPRECIATION_RATE = 0.02;

  const loanStates: LoanState[] = profile.loans
    .map((l) => ({
      id: l.id,
      principal: l.principal || 0,
      interestRate: l.interestRate || 0,
    }))
    .sort((a, b) => b.interestRate - a.interestRate);

  const realEstateStates: RealEstateState[] = profile.realEstateAssets.map(
    (a) => ({ name: a.name, value: a.currentValue })
  );

  let cumulativeSavings = 0;
  const projection: MonthlyData[] = [];

  const peakWageStartAge =
    profile.retirementAge - (profile.peakWagePeriod || 0);
  let peakSalaryBeforeReduction = 0;
  let fixedPeakSalary = 0;
  let inflationMultiplier = 1.0;

  const overrides = profile.projectedData.filter((d) => d.isOverridden);

  for (let year = today.getFullYear(); year <= retirementYear; year++) {
    const currentAge = currentUserAge + (year - today.getFullYear());

    if (currentAge === peakWageStartAge - 1) {
      const tempInflationMultiplier =
        inflationMultiplier * (1 + SALARY_INFLATION_RATE);
      const lastMonthIncome =
        profile.monthlyIncomes.find((i) => i.month === 12)?.income || 0;
      peakSalaryBeforeReduction = lastMonthIncome * tempInflationMultiplier;
      fixedPeakSalary =
        peakSalaryBeforeReduction *
        (1 - (profile.peakWageReductionRate || 0) / 100);
    }

    if (year > today.getFullYear()) {
      inflationMultiplier *= 1 + SALARY_INFLATION_RATE;
      realEstateStates.forEach((asset) => {
        asset.value *= 1 + REAL_ESTATE_APPRECIATION_RATE;
      });
    }

    for (let month = 1; month <= 12; month++) {
      if (year === today.getFullYear() && month < today.getMonth() + 1)
        continue;

      const overrideData = overrides.find(
        (d) => d.year === year && d.month === month
      );

      const baseIncomeData = profile.monthlyIncomes.find(
        (i) => i.month === month
      );
      let monthlyIncome = (baseIncomeData?.income || 0) * inflationMultiplier;
      let monthlyBonus = (baseIncomeData?.bonus || 0) * inflationMultiplier;

      if (currentAge >= peakWageStartAge) {
        monthlyIncome = fixedPeakSalary;
        monthlyBonus = 0;
      }

      let monthlyConsumption = 0;
      if (profile.consumptionType === "PERCENTAGE") {
        monthlyConsumption =
          (monthlyIncome + monthlyBonus) *
          ((profile.monthlyConsumptionValue || 0) / 100);
      } else {
        monthlyConsumption = profile.monthlyConsumptionValue || 0;
      }

      if (overrideData) {
        if (overrideData.income !== null) {
          monthlyIncome = overrideData.income;
          monthlyBonus = 0;
        }
        if (overrideData.monthlyConsumption !== null) {
          monthlyConsumption = overrideData.monthlyConsumption;
        }
      }

      const totalMonthlyIncome = monthlyIncome + monthlyBonus;
      const totalRepaymentAmount = profile.monthlyRepayment || 0;
      let loanInterestPaidThisMonth = 0;
      let loanPrincipalPaidThisMonth = 0;
      let paymentPool = totalRepaymentAmount;

      for (const loan of loanStates) {
        if (loan.principal <= 0 || paymentPool <= 0) continue;
        const interestForMonth =
          (loan.principal * (loan.interestRate / 100)) / 12;
        const interestPayment = Math.min(paymentPool, interestForMonth);
        loanInterestPaidThisMonth += interestPayment;
        paymentPool -= interestPayment;
        if (paymentPool > 0) {
          const principalPayment = Math.min(paymentPool, loan.principal);
          loan.principal -= principalPayment;
          loanPrincipalPaidThisMonth += principalPayment;
          paymentPool -= principalPayment;
        }
      }
      const totalLoanPayment =
        loanInterestPaidThisMonth + loanPrincipalPaidThisMonth;
      cumulativeSavings += profile.monthlySavings || 0;
      const incomeForConsumption =
        totalMonthlyIncome - totalLoanPayment - (profile.monthlyInsurance || 0);
      const disposableIncome =
        incomeForConsumption -
        (profile.monthlySavings || 0) -
        monthlyConsumption;
      const remainingLoanPrincipal = loanStates.reduce(
        (sum, l) => sum + l.principal,
        0
      );
      const currentRealEstateValue = realEstateStates.reduce(
        (sum, asset) => sum + asset.value,
        0
      );
      const totalAssets = cumulativeSavings + currentRealEstateValue;

      projection.push({
        year,
        month,
        income: monthlyIncome,
        bonus: monthlyBonus,
        loanInterestPaid: loanInterestPaidThisMonth,
        loanPrincipalPaid: loanPrincipalPaidThisMonth,
        totalLoanPayment,
        monthlyConsumption,
        cumulativeSavings,
        remainingLoanPrincipal,
        disposableIncome,
        realEstateValue: currentRealEstateValue,
        totalAssets,
        isOverridden: overrideData ? true : false,
      });
    }
  }

  const finalState = projection[projection.length - 1];
  const finalRealEstateValue = finalState.realEstateValue;
  const finalSavings = finalState?.cumulativeSavings || 0;
  const finalLiabilities = finalState?.remainingLoanPrincipal || 0;

  const summary = {
    retirementYear,
    finalSavings,
    finalRealEstateValue,
    finalAssets: finalSavings + finalRealEstateValue,
    finalLiabilities,
    totalInterestPaid: projection.reduce(
      (sum, p) => sum + p.loanInterestPaid,
      0
    ),
  };

  return { projection, summary };
};
