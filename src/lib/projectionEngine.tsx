import type {
  ProfileData,
  MonthlyData,
  LoanState,
  RealEstateState,
} from "../types";

/**
 * 프로필 ID를 기반으로 미래 재무 상황을 예측하여 반환합니다.
 * @param profile 예측을 생성할 사용자의 프로필 데이터 객체
 * @returns {Promise<{projection: MonthlyData[], summary: object}>} 월별 예측 데이터 배열과 최종 요약 객체
 */
export const generateProjection = (profile: ProfileData) => {
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

  const SALARY_INFLATION_RATE = profile.salaryInflationRate
    ? profile.salaryInflationRate / 100
    : 0.02;
  const REAL_ESTATE_APPRECIATION_RATE = 0.02; // 부동산 연간 가치 상승률 2% (가정)

  // [수정] profile.loans/realEstateAssets가 undefined일 경우 빈 배열([])을 사용하고, 깊은 복사로 원본 데이터 불변성 유지
  const loanStates: LoanState[] = JSON.parse(
    JSON.stringify(
      (profile.loans ?? []).map((l) => ({ ...l, principal: l.principal || 0 }))
    )
  );
  const realEstateStates: RealEstateState[] = JSON.parse(
    JSON.stringify(
      (profile.realEstateAssets ?? []).map((a) => ({
        name: a.name,
        value: a.currentValue,
      }))
    )
  );

  let cumulativeSavings = 0;
  const projection: MonthlyData[] = [];

  const peakWageStartAge =
    profile.retirementAge - (profile.peakWagePeriod || 0);
  let peakSalaryBeforeReduction = 0;
  let fixedPeakSalary = 0;
  let inflationMultiplier = 1.0;

  // --- 메인 시뮬레이션 루프 (정년까지 매년, 매월 반복) ---
  for (let year = today.getFullYear(); year <= retirementYear; year++) {
    const currentAge = currentUserAge + (year - today.getFullYear());

    if (currentAge === peakWageStartAge - 1) {
      const tempInflationMultiplier =
        inflationMultiplier * (1 + SALARY_INFLATION_RATE);
      const lastMonthIncome =
        profile.monthlyIncomes.find((i) => i.month === 12)?.income || 0;
      peakSalaryBeforeReduction = lastMonthIncome * tempInflationMultiplier;
      const reductionRate = profile.peakWageReductionRate
        ? profile.peakWageReductionRate / 100
        : 0.2;
      fixedPeakSalary = peakSalaryBeforeReduction * (1 - reductionRate);
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

      const overrideData = profile.overrides?.[year]?.[month] || {};
      const isOverridden = Object.keys(overrideData).length > 0;

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

      if (overrideData.income !== undefined) {
        monthlyIncome = overrideData.income;
        monthlyBonus = 0;
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
      let monthlyConsumption = 0;
      if (overrideData.monthlyConsumption !== undefined) {
        monthlyConsumption = overrideData.monthlyConsumption;
      } else {
        if (profile.consumptionType === "PERCENTAGE") {
          monthlyConsumption =
            incomeForConsumption *
            ((profile.monthlyConsumptionValue || 0) / 100);
        } else {
          monthlyConsumption = profile.monthlyConsumptionValue || 0;
        }
      }

      const disposableIncome =
        incomeForConsumption -
        (profile.monthlySavings || 0) -
        monthlyConsumption;
      const remainingLoanPrincipal = loanStates.reduce(
        (sum, l) => sum + l.principal,
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
        isOverridden,
      });
    }
  }

  // --- 최종 결과 요약 생성 ---
  const finalState = projection[projection.length - 1];
  const finalRealEstateValue = realEstateStates.reduce(
    (sum, asset) => sum + asset.value,
    0
  );
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
