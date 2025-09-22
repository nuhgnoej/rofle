// server/src/projectionService.ts
import { PrismaClient } from "@prisma/client";
import {
  calculateMonthlyInterest,
  calculateEqualPayment,
  calculateEqualPrincipal,
  calculateBulletPrincipal,
} from "./loanCalculator";

const prisma = new PrismaClient();

// --- 데이터 구조에 대한 타입 정의 ---
interface LoanState {
  id: string;
  name: string | null;
  type: string;
  principal: number;
  interestRate: number;
  termInYears: number | null;
  gracePeriodInYears: number | null;
  paymentMethod: string;
  remainingPrincipal: number;
  profileId: string;
}

interface RealEstateState {
  name: string;
  value: number;
}

// 💡 수정된 MonthlyData 인터페이스: 총합 대출 관련 필드 제거
interface MonthlyData {
  year: number;
  month: number;
  income: number;
  bonus: number;
  monthlyConsumption: number;
  cumulativeSavings: number;
  disposableIncome: number;
  realEstateValue: number;
  totalAssets: number;
  remainingLoanPrincipalTotal: number;
}

// 💡 새로운 타입: 월별 개별 대출 상태 저장용
interface ProjectedLoanStateData {
  year: number;
  month: number;
  principalPaid: number;
  interestPaid: number;
  remainingPrincipal: number;
  profileId: string;
  loanId: string;
  projectedDataId?: string;
}

/**
 * 프로필 ID를 기반으로 미래 재무 상황을 예측하여 반환합니다.
 */
export const generateProjection = async (profileId: string) => {
  const profile = await prisma.financialProfile.findUnique({
    where: { id: profileId },
    include: { monthlyIncomes: true, loans: true, realEstateAssets: true },
  });

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

  const salaryInflationRate = (profile.salaryInflationRate || 0) / 100;
  const REAL_ESTATE_APPRECIATION_RATE = 0.02;

  let loanStates: LoanState[] = profile.loans
    .map((l) => ({
      ...l,
      remainingPrincipal: l.principal || 0,
      paymentMethod: l.paymentMethod ?? "",
      type: l.type ?? "", // 👈 null인 경우 빈 문자열로 대체
    }))
    .sort((a, b) => b.interestRate - a.interestRate);

  let realEstateStates: RealEstateState[] = profile.realEstateAssets.map(
    (a) => ({ name: a.name, value: a.currentValue })
  );

  let cumulativeSavings = 0;
  const projection: MonthlyData[] = [];
  const projectedLoanStates: ProjectedLoanStateData[] = []; // 💡 새로운 배열

  const peakWageStartAge =
    profile.retirementAge - (profile.peakWagePeriod || 0);

  let fixedPeakSalary = 0;

  const originalIncomes = profile.monthlyIncomes.map((inc) => ({ ...inc }));

  for (let year = today.getFullYear(); year <= retirementYear; year++) {
    const currentAge = currentUserAge + (year - today.getFullYear());

    if (
      currentAge === peakWageStartAge &&
      profile.peakWagePeriod &&
      profile.peakWagePeriod > 0
    ) {
      const lastMonthIncome =
        originalIncomes.find((i) => i.month === 12)?.income || 0;
      const peakWageReductionRate = (profile.peakWageReductionRate || 0) / 100;
      fixedPeakSalary = lastMonthIncome * (1 - peakWageReductionRate);
    }

    realEstateStates.forEach((asset) => {
      asset.value *= 1 + REAL_ESTATE_APPRECIATION_RATE;
    });

    for (let month = 1; month <= 12; month++) {
      if (year === today.getFullYear() && month < today.getMonth() + 1)
        continue;

      let monthlyIncome = 0;
      let monthlyBonus = 0;

      if (
        currentAge >= peakWageStartAge &&
        profile.peakWagePeriod &&
        profile.peakWagePeriod > 0
      ) {
        monthlyIncome = fixedPeakSalary;
        monthlyBonus = 0;
      } else {
        const incomeData = originalIncomes.find((inc) => inc.month === month);
        monthlyIncome =
          (incomeData?.income || 0) *
          Math.pow(1 + salaryInflationRate, year - today.getFullYear());
        monthlyBonus =
          (incomeData?.bonus || 0) *
          Math.pow(1 + salaryInflationRate, year - today.getFullYear());
      }

      const totalMonthlyIncome = monthlyIncome + monthlyBonus;
      let paymentPool = profile.monthlyRepayment || 0; // 💡 1단계: 최소 필수 상환액 계산
      let totalRequiredPayment = 0;
      const monthlyLoanPayments: ProjectedLoanStateData[] = [];

      for (const loan of loanStates) {
        if (loan.remainingPrincipal <= 0) continue;

        const currentMonthInTotal = (year - today.getFullYear()) * 12 + month;
        const termInMonths = (loan.termInYears || 0) * 12;
        const gracePeriodInMonths = (loan.gracePeriodInYears || 0) * 12;

        let principalPaid = 0;
        let interestPaid = 0;
        const repaymentMonth = currentMonthInTotal - gracePeriodInMonths; // 거치 기간 중에는 이자만 납부

        if (currentMonthInTotal <= gracePeriodInMonths) {
          interestPaid = calculateMonthlyInterest(
            loan.remainingPrincipal,
            loan.interestRate
          );
        } else {
          switch (loan.paymentMethod) {
            case "원리금균등":
              const equalPayment = calculateEqualPayment(
                loan.principal,
                loan.interestRate,
                termInMonths - gracePeriodInMonths
              );
              interestPaid = calculateMonthlyInterest(
                loan.remainingPrincipal,
                loan.interestRate
              );
              principalPaid = Math.min(
                equalPayment - interestPaid,
                loan.remainingPrincipal
              );
              break;
            case "원금균등":
              principalPaid = calculateEqualPrincipal(
                loan.principal,
                termInMonths - gracePeriodInMonths
              );
              interestPaid = calculateMonthlyInterest(
                loan.remainingPrincipal,
                loan.interestRate
              );
              break;
            case "만기일시":
              principalPaid = calculateBulletPrincipal(
                loan.principal,
                repaymentMonth,
                termInMonths - gracePeriodInMonths
              );
              interestPaid = calculateMonthlyInterest(
                loan.remainingPrincipal,
                loan.interestRate
              );
              break;
          }
        }
        totalRequiredPayment += principalPaid + interestPaid;

        monthlyLoanPayments.push({
          year,
          month,
          principalPaid,
          interestPaid,
          remainingPrincipal: loan.remainingPrincipal,
          profileId: profileId,
          loanId: loan.id,
        });
      } // 💡 2단계: paymentPool 검증 및 배분

      if (paymentPool < totalRequiredPayment) {
        throw new Error("월 상환액이 모든 필수 상환액을 갚기에 부족합니다.");
      }

      let extraPaymentPool = paymentPool - totalRequiredPayment;
      let totalLoanInterestPaid = monthlyLoanPayments.reduce(
        (sum, p) => sum + p.interestPaid,
        0
      );
      let totalLoanPrincipalPaid = monthlyLoanPayments.reduce(
        (sum, p) => sum + p.principalPaid,
        0
      ); // 필수 상환액으로 각 대출의 원금 및 이자 업데이트
      for (const loan of loanStates) {
        const loanPayment = monthlyLoanPayments.find(
          (p) => p.loanId === loan.id
        );
        if (loanPayment) {
          loan.remainingPrincipal -= loanPayment.principalPaid;
          loanPayment.remainingPrincipal = loan.remainingPrincipal; // 💡 loanPayment 객체 업데이트
        }
      } // 💡 3단계: 추가 상환 여유 금액 배분

      for (const loan of loanStates) {
        if (loan.remainingPrincipal <= 0 || extraPaymentPool <= 0) continue;

        const extraPrincipalPayment = Math.min(
          extraPaymentPool,
          loan.remainingPrincipal
        );
        loan.remainingPrincipal -= extraPrincipalPayment;
        totalLoanPrincipalPaid += extraPrincipalPayment;
        extraPaymentPool -= extraPrincipalPayment; // 💡 monthlyLoanPayments에 추가 상환 내역 반영

        const loanPayment = monthlyLoanPayments.find(
          (p) => p.loanId === loan.id
        );
        if (loanPayment) {
          loanPayment.principalPaid += extraPrincipalPayment;
          loanPayment.remainingPrincipal = loan.remainingPrincipal;
        }
      }
      const remainingLoanPrincipalTotal = loanStates.reduce(
        (sum, l) => sum + l.remainingPrincipal,
        0
      ); // 💡 projectedLoanStates 배열에 결과 추가

      projectedLoanStates.push(...monthlyLoanPayments);

      const totalLoanPayment = totalLoanInterestPaid + totalLoanPrincipalPaid;
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
      const currentRealEstateValue = realEstateStates.reduce(
        (sum, asset) => sum + asset.value,
        0
      );
      const totalAssets =
        cumulativeSavings +
        currentRealEstateValue -
        remainingLoanPrincipalTotal; // --- 5. 결과 배열에 월별 데이터 추가 ---
      projection.push({
        year,
        month,
        income: monthlyIncome,
        bonus: monthlyBonus,
        monthlyConsumption,
        cumulativeSavings,
        disposableIncome,
        realEstateValue: currentRealEstateValue,
        totalAssets,
        remainingLoanPrincipalTotal,
      });
    }
  } // --- 6. 최종 결과 요약 생성 ---
  const finalState = projection[projection.length - 1];
  const finalRealEstateValue = realEstateStates.reduce(
    (sum, asset) => sum + asset.value,
    0
  );
  const finalSavings = finalState?.cumulativeSavings || 0;
  const finalLiabilities = finalState?.remainingLoanPrincipalTotal || 0;

  const summary = {
    retirementYear,
    finalSavings,
    finalRealEstateValue,
    finalAssets: finalSavings + finalRealEstateValue,
    finalLiabilities,
    totalInterestPaid: projectedLoanStates.reduce(
      (sum, p) => sum + p.interestPaid,
      0
    ),
  };

  return { projection, projectedLoanStates, summary };
};
