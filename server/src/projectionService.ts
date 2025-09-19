// server/src/projectionService.ts
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
  realEstateValue: number;
}

/**
 * 프로필 ID를 기반으로 미래 재무 상황을 예측하여 반환합니다.
 * @param profileId 예측을 생성할 사용자의 프로필 ID
 * @returns {Promise<{projection: MonthlyData[], summary: object}>} 월별 예측 데이터 배열과 최종 요약 객체
 */
export const generateProjection = async (profileId: string) => {
  // 1. 초기 데이터 로드: 데이터베이스에서 프로필 전체 정보 가져오기
  const profile = await prisma.financialProfile.findUnique({
    where: { id: profileId },
    include: { monthlyIncomes: true, loans: true, realEstateAssets: true },
  });

  if (!profile || !profile.dob || !profile.retirementAge) {
    throw new Error(
      "예측에 필요한 필수 프로필 정보(생년월일, 정년)가 없습니다."
    );
  }

  // --- 2. 시뮬레이션을 위한 초기 변수 설정 ---
  const today = new Date();
  const retirementYear =
    new Date(profile.dob).getFullYear() + profile.retirementAge;
  const currentUserAge =
    today.getFullYear() - new Date(profile.dob).getFullYear();

  const salaryInflationRate = (profile.salaryInflationRate || 0) / 100;
  console.log("salaryInflationRate: ", salaryInflationRate);
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

  let fixedPeakSalary = 0;
  let isPeakWagePeriod = false;

  // ✨ 임금 상승을 위한 원본 월급 데이터 복사
  const originalIncomes = profile.monthlyIncomes.map((inc) => ({ ...inc }));

  // --- 3. 메인 시뮬레이션 루프 (연도별) ---
  for (let year = today.getFullYear(); year <= retirementYear; year++) {
    const currentAge = currentUserAge + (year - today.getFullYear());

    // ✨ 연도 시작 시점에 해당 연도의 임금 상승률을 적용한 값을 계산
    const currentYearIncomes = originalIncomes.map((inc) => ({
      ...inc,
      income:
        inc.income *
        Math.pow(1 + salaryInflationRate, year - today.getFullYear()),
      bonus:
        inc.bonus *
        Math.pow(1 + salaryInflationRate, year - today.getFullYear()),
    }));

    if (
      currentAge === peakWageStartAge &&
      profile.peakWagePeriod &&
      profile.peakWagePeriod > 0
    ) {
      const lastMonthIncome =
        currentYearIncomes.find((i) => i.month === 12)?.income || 0;
      const peakWageReductionRate = (profile.peakWageReductionRate || 0) / 100;
      fixedPeakSalary = lastMonthIncome * (1 - peakWageReductionRate);
    }

    // 부동산 가치 연간 상승분 적용
    realEstateStates.forEach((asset) => {
      asset.value *= 1 + REAL_ESTATE_APPRECIATION_RATE;
    });

    // --- 4. 월별 계산 루프 ---
    for (let month = 1; month <= 12; month++) {
      if (year === today.getFullYear() && month < today.getMonth() + 1)
        continue;

      let monthlyIncome = 0;
      let monthlyBonus = 0;

      // 현재 나이에 따라 임금피크제 또는 일반 임금 상승률 적용
      if (
        currentAge >= peakWageStartAge &&
        profile.peakWagePeriod &&
        profile.peakWagePeriod > 0
      ) {
        monthlyIncome = fixedPeakSalary;
        monthlyBonus = 0;
      } else {
        const incomeData = currentYearIncomes.find(
          (inc) => inc.month === month
        );
        monthlyIncome = incomeData?.income || 0;
        monthlyBonus = incomeData?.bonus || 0;
      }

      const totalMonthlyIncome = monthlyIncome + monthlyBonus;
      let paymentPool = profile.monthlyRepayment || 0;

      // 대출 상환 로직 (총 상환액을 대출별로 분배)
      let totalLoanInterestPaid = 0;
      let totalLoanPrincipalPaid = 0;

      for (const loan of loanStates) {
        if (loan.principal <= 0 || paymentPool <= 0) continue;

        const monthlyInterest =
          (loan.principal * (loan.interestRate / 100)) / 12;

        const interestPayment = Math.min(paymentPool, monthlyInterest);
        totalLoanInterestPaid += interestPayment;
        paymentPool -= interestPayment;

        if (paymentPool > 0) {
          const principalPayment = Math.min(paymentPool, loan.principal);
          loan.principal -= principalPayment;
          totalLoanPrincipalPaid += principalPayment;
          paymentPool -= principalPayment;
        }
      }
      const totalLoanPayment = totalLoanInterestPaid + totalLoanPrincipalPaid;

      // 적금, 소비, 가용금액 계산
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

      const currentRealEstateValue = realEstateStates.reduce(
        (sum, asset) => sum + asset.value,
        0
      );

      // --- 5. 결과 배열에 월별 데이터 추가 ---
      projection.push({
        year,
        month,
        income: monthlyIncome,
        bonus: monthlyBonus,
        loanInterestPaid: totalLoanInterestPaid,
        loanPrincipalPaid: totalLoanPrincipalPaid,
        totalLoanPayment,
        monthlyConsumption,
        cumulativeSavings,
        remainingLoanPrincipal,
        disposableIncome,
        realEstateValue: currentRealEstateValue,
      });
    }
  }

  // --- 6. 최종 결과 요약 생성 ---
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
