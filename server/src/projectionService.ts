import { PrismaClient, ConsumptionType } from "@prisma/client";

const prisma = new PrismaClient();

// --- 데이터 구조에 대한 타입 정의 ---
interface LoanState {
  id: string;
  principal: number;
  interestRate: number;
}

interface RealEstateState {
  name: string;
  value: number;
}

interface MonthlyData {
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
}

/**
 * 프로필 ID를 기반으로 미래 재무 상황을 예측하여 반환합니다.
 * @param profileId 예측을 생성할 사용자의 프로필 ID
 * @returns {Promise<{projection: MonthlyData[], summary: object}>} 월별 예측 데이터 배열과 최종 요약 객체
 */
export const generateProjection = async (profileId: string) => {
  // 1. 데이터베이스에서 프로필 전체 정보 가져오기
  const profile = await prisma.financialProfile.findUnique({
    where: { id: profileId },
    include: { monthlyIncomes: true, loans: true, realEstateAssets: true },
  });

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

  const SALARY_INFLATION_RATE = 0.02;
  const REAL_ESTATE_APPRECIATION_RATE = 0.02;

  let loanStates: LoanState[] = profile.loans
    .map((l) => ({
      id: l.id,
      principal: l.principal || 0,
      interestRate: l.interestRate || 0,
    }))
    .sort((a, b) => b.interestRate - a.interestRate);

  let realEstateStates: RealEstateState[] = profile.realEstateAssets.map(
    (a) => ({ name: a.name, value: a.currentValue })
  );

  let cumulativeSavings = 0;
  const projection: MonthlyData[] = [];

  const peakWageStartAge =
    profile.retirementAge - (profile.peakWagePeriod || 0);
  let peakSalaryBeforeReduction = 0;
  let fixedPeakSalary = 0;
  let inflationMultiplier = 1.0;

  // --- 메인 시뮬레이션 루프 ---
  for (let year = today.getFullYear(); year <= retirementYear; year++) {
    const currentAge = currentUserAge + (year - today.getFullYear());

    if (currentAge === peakWageStartAge - 1) {
      const tempInflationMultiplier =
        inflationMultiplier * (1 + SALARY_INFLATION_RATE);
      const lastMonthIncome =
        profile.monthlyIncomes.find((i) => i.month === 12)?.income || 0;
      peakSalaryBeforeReduction = lastMonthIncome * tempInflationMultiplier;
      fixedPeakSalary = peakSalaryBeforeReduction * 0.8;
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

      const totalMonthlyIncome = monthlyIncome + monthlyBonus;

      let totalRepaymentAmount = profile.monthlyRepayment || 0;
      // 참고: 향후 repaymentType 필드를 추가하면 아래 로직을 활성화할 수 있습니다.
      // if (profile.repaymentType === 'PERCENTAGE') {
      //   totalRepaymentAmount = totalMonthlyIncome * ((profile.monthlyRepayment || 0) / 100);
      // }

      // --- [버그 수정] 다중 대출 상환 로직 ---
      let loanInterestPaidThisMonth = 0;
      let loanPrincipalPaidThisMonth = 0;
      let paymentPool = totalRepaymentAmount; // 이번 달에 사용할 수 있는 총상환금

      for (const loan of loanStates) {
        if (loan.principal <= 0 || paymentPool <= 0) continue;

        // 1. 해당 대출의 이자 계산
        const interestForMonth =
          (loan.principal * (loan.interestRate / 100)) / 12;

        // 2. 이자 상환
        const interestPayment = Math.min(paymentPool, interestForMonth);
        loanInterestPaidThisMonth += interestPayment;
        paymentPool -= interestPayment;

        // 3. 남은 돈으로 원금 상환
        if (paymentPool > 0) {
          const principalPayment = Math.min(paymentPool, loan.principal);
          loan.principal -= principalPayment;
          loanPrincipalPaidThisMonth += principalPayment;
          paymentPool -= principalPayment;
        }
      }
      const totalLoanPayment =
        loanInterestPaidThisMonth + loanPrincipalPaidThisMonth;

      // 적금 누계, 소비금액, 가용금액 계산...
      cumulativeSavings += profile.monthlySavings || 0;

      const incomeForConsumption =
        totalMonthlyIncome - totalLoanPayment - (profile.monthlyInsurance || 0);
      let monthlyConsumption = 0;
      if (profile.consumptionType === "PERCENTAGE") {
        monthlyConsumption =
          incomeForConsumption * ((profile.monthlyConsumptionValue || 0) / 100);
      } else {
        monthlyConsumption = profile.monthlyConsumptionValue || 0;
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
