import type { MonthlyData, LoanState, RealEstateState, ProfileData } from "../types";

// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

/**
 * 프로필 ID를 기반으로 미래 재무 상황을 예측하여 반환합니다.
 * @param profileId 예측을 생성할 사용자의 프로필 ID
 * @returns {Promise<{projection: MonthlyData[], summary: object}>} 월별 예측 데이터 배열과 최종 요약 객체
 */
export const generateProjection = (profileData: ProfileData) => {
  // 1. 데이터베이스에서 프로필 전체 정보 가져오기
  const profile = profileData;

  if (!profile || !profile.dob || !profile.retirementAge) {
    throw new Error(
      "예측에 필요한 필수 프로필 정보(생년월일, 정년)가 없습니다."
    );
  }

  // --- 시뮬레이션을 위한 초기 변수 설정 ---
  const today = new Date();
  const retirementYear =
    new Date(profile.dob).getFullYear() + profile.retirementAge;
  const currentUserAge =
    today.getFullYear() - new Date(profile.dob).getFullYear();

  const SALARY_INFLATION_RATE = profile.salaryInflationRate || 0.02; // 사용자 입력값 사용
  const REAL_ESTATE_APPRECIATION_RATE = 0.02; // 부동산 상승률은 현재 상수값으로 유지

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

  // --- [추가] ProjectedData에서 isOverridden이 true인 값으로 초기화 ---
  const overrides = profile.projectedData.filter((d) => d.isOverridden);

  // --- 메인 시뮬레이션 루프 ---
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
        (1 - (profile.peakWageReductionRate || 0) / 100); // 감소율 적용
    }

    if (year > today.getFullYear()) {
      inflationMultiplier *= 1 + SALARY_INFLATION_RATE;
      // --- [수정] 부동산 가치 계산은 연도별로 한 번만 수행 ---
      realEstateStates.forEach((asset) => {
        asset.value *= 1 + REAL_ESTATE_APPRECIATION_RATE;
      });
    }

    for (let month = 1; month <= 12; month++) {
      if (year === today.getFullYear() && month < today.getMonth() + 1)
        continue;

      // --- [수정] 오버라이드 값 적용 ---
      const overrideData = overrides.find(
        (d) => d.year === year && d.month === month
      );

      const baseIncomeData = profile.monthlyIncomes.find(
        (i) => i.month === month
      );
      let monthlyIncome = baseIncomeData?.income || 0;
      let monthlyBonus = baseIncomeData?.bonus || 0;

      if (currentAge >= peakWageStartAge) {
        monthlyIncome = fixedPeakSalary;
        monthlyBonus = 0;
      } else {
        monthlyIncome *= inflationMultiplier;
        monthlyBonus *= inflationMultiplier;
      }

      let monthlyConsumption = 0;
      if (profile.consumptionType === "PERCENTAGE") {
        monthlyConsumption =
          (monthlyIncome + monthlyBonus) *
          ((profile.monthlyConsumptionValue || 0) / 100);
      } else {
        monthlyConsumption = profile.monthlyConsumptionValue || 0;
      }

      // 오버라이드된 값이 있으면 적용
      if (overrideData) {
        if (overrideData.income !== null) {
          monthlyIncome = overrideData.income;
          monthlyBonus = 0; // 보너스는 오버라이드 시 0으로 가정
        }
        if (overrideData.monthlyConsumption !== null) {
          monthlyConsumption = overrideData.monthlyConsumption;
        }
      }

      const totalMonthlyIncome = monthlyIncome + monthlyBonus;

      // ... 기존의 대출 상환, 소비, 적금 로직 ...
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

      // --- [추가] 부동산 가치 및 현재 시점의 자산 계산을 배열에 포함 ---
      const currentRealEstateValue = realEstateStates.reduce(
        (sum, asset) => sum + asset.value,
        0
      );

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
        totalAssets: cumulativeSavings + currentRealEstateValue,
        isOverridden: false,
      });
    }
  }

  // --- 최종 결과 요약 생성 ---
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
