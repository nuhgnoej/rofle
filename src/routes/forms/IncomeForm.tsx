import { useFormStore } from "../../stores/form.store";
import { useMemo } from "react";
import type { MonthlyIncome } from "../../types";

// 총소득을 계산하는 헬퍼 함수
const calculateTotalIncome = (
  incomes: MonthlyIncome[],
  inflationRate: number,
  retirementAge: number,
  dob: string,
  peakWagePeriod: number,
  peakWageReductionRate: number
) => {
  if (!dob || !retirementAge) return 0;

  const currentYear = new Date().getFullYear();
  const birthYear = new Date(dob).getFullYear();
  const currentAge = currentYear - birthYear;
  const workingYears = retirementAge - currentAge;

  if (workingYears <= 0) return 0;

  const annualBaseIncome = incomes.reduce(
    (sum, month) => sum + (month.income || 0) + (month.bonus || 0),
    0
  );

  let totalProjectedIncome = 0;
  const peakWageStartAge = retirementAge - peakWagePeriod;
  let fixedPeakSalary = 0;

  for (let i = 0; i < workingYears; i++) {
    const projectedAge = currentAge + i;
    let yearlyIncome = annualBaseIncome * Math.pow(1 + inflationRate / 100, i);

    if (projectedAge === peakWageStartAge - 1) {
      const peakSalaryBeforeReduction =
        annualBaseIncome * Math.pow(1 + inflationRate / 100, i + 1);
      fixedPeakSalary =
        peakSalaryBeforeReduction * (1 - peakWageReductionRate / 100);
    }

    if (projectedAge >= peakWageStartAge) {
      yearlyIncome = fixedPeakSalary;
    }

    totalProjectedIncome += yearlyIncome;
  }

  return Math.round(totalProjectedIncome);
};

export default function IncomeForm() {
  // 필요한 모든 상태를 개별적으로 구독합니다.
  const monthlyIncomes = useFormStore((state) => state.monthlyIncomes);
  const dob = useFormStore((state) => state.dob);
  const retirementAge = useFormStore((state) => state.retirementAge);
  const salaryInflationRate = useFormStore(
    (state) => state.salaryInflationRate
  );
  const peakWagePeriod = useFormStore((state) => state.peakWagePeriod);
  const peakWageReductionRate = useFormStore(
    (state) => state.peakWageReductionRate
  );
  const setProfileData = useFormStore((state) => state.setProfileData);

  const currentYear = new Date().getFullYear();

  const isReadyForCalculation = useMemo(() => {
    if (!dob || !retirementAge) return false;
    const birthYear = new Date(dob).getFullYear();
    const currentAge = currentYear - birthYear;
    return retirementAge > currentAge;
  }, [dob, retirementAge, currentYear]);

  const totalProjectedIncome = useMemo(() => {
    if (!isReadyForCalculation) return 0;
    return calculateTotalIncome(
      monthlyIncomes,
      salaryInflationRate || 2,
      retirementAge,
      dob,
      peakWagePeriod || 0,
      peakWageReductionRate || 0
    );
  }, [
    isReadyForCalculation,
    monthlyIncomes,
    salaryInflationRate,
    retirementAge,
    dob,
    peakWagePeriod,
    peakWageReductionRate,
  ]);

  const handleIncomeChange = (
    month: number,
    field: "income" | "bonus",
    value: string
  ) => {
    const newIncomes = monthlyIncomes.map((inc) =>
      inc.month === month ? { ...inc, [field]: parseFloat(value) || 0 } : inc
    );
    setProfileData({ monthlyIncomes: newIncomes });
  };

  const handleInflationChange = (value: string) => {
    setProfileData({ salaryInflationRate: parseFloat(value) || 0 });
  };

  if (!isReadyForCalculation) {
    return (
      <div className="text-center p-10 bg-gray-50 dark:bg-accent/20 rounded-lg">
        <h3 className="text-xl font-bold text-text mb-2">
          미래 계획 정보 필요
        </h3>
        <p className="text-secondary">
          정확한 소득 예측을 위해 '미래 계획' 탭에서 올바른 생년월일과 현재
          나이보다 많은 정년 정보를 입력해주세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text">
          기준 연간 수입 정보 ({currentYear}년)
        </h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-secondary">
            연간 임금 상승률
          </label>
          <input
            type="number"
            value={salaryInflationRate || ""}
            onChange={(e) => handleInflationChange(e.target.value)}
            className="w-20 text-sm p-2 rounded-md bg-background border text-right"
            placeholder="2"
          />
          <span className="text-sm text-secondary">%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {monthlyIncomes.map(({ month, income, bonus }) => (
          <div key={month} className="flex items-center gap-2">
            <label className="w-12 text-sm font-medium text-secondary">
              {month}월
            </label>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <input
                type="number"
                placeholder="월급"
                value={income || ""}
                onChange={(e) =>
                  handleIncomeChange(month, "income", e.target.value)
                }
                className="w-full text-sm p-2 rounded-md bg-background border"
              />
              <input
                type="number"
                placeholder="보너스"
                value={bonus || ""}
                onChange={(e) =>
                  handleIncomeChange(month, "bonus", e.target.value)
                }
                className="w-full text-sm p-2 rounded-md bg-background border"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-accent rounded-lg text-center">
        <p className="text-secondary">
          입력된 정보를 바탕으로 계산한 예상 정년까지의 총소득은 약
          <span className="font-bold text-primary text-lg mx-1">
            {totalProjectedIncome.toLocaleString()}
          </span>
          만원입니다.
        </p>
      </div>
    </div>
  );
}
