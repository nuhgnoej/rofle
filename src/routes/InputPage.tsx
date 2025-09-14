import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// --- 1. 수입 정보 섹션 (스타일 수정) ---
const IncomeSection: React.FC = () => {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <div className="p-6 bg-card rounded-lg shadow-lg h-full">
      <h2 className="text-lg font-bold text-text mb-4">수입 정보</h2>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-3">
        {months.map((month) => (
          <MonthlyIncomeInput key={month} month={month} />
        ))}
      </div>
    </div>
  );
};

const MonthlyIncomeInput: React.FC<{ month: number }> = ({ month }) => (
  <div className="flex items-center gap-2">
    <label
      htmlFor={`monthly_income_${month}`}
      className="w-12 text-sm font-medium text-secondary"
    >
      {month}월
    </label>
    <div className="grid grid-cols-2 gap-2 flex-1">
      <div className="relative">
        <input
          id={`monthly_income_${month}`}
          name={`monthly_income_${month}`}
          type="number"
          placeholder="수입"
          className="w-full text-sm pl-2 pr-10 py-1.5 rounded-md bg-background border border-border focus:ring-1 focus:ring-primary focus:border-primary transition"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-secondary">
          만원
        </span>
      </div>
      <div className="relative">
        <input
          id={`bonus_${month}`}
          name={`bonus_${month}`}
          type="number"
          placeholder="보너스"
          className="w-full text-sm pl-2 pr-10 py-1.5 rounded-md bg-background border border-border focus:ring-1 focus:ring-primary focus:border-primary transition"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-secondary">
          만원
        </span>
      </div>
    </div>
  </div>
);

// --- 2. 동적 대출 정보 섹션 (스타일 수정) ---
interface Loan {
  id: number;
  principal: string;
  interestRate: string;
}
interface LoanSectionProps {
  loans: Loan[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onChange: (id: number, field: keyof Omit<Loan, "id">, value: string) => void;
}
const LoanSection: React.FC<LoanSectionProps> = ({
  loans,
  onAdd,
  onRemove,
  onChange,
}) => {
  return (
    <div className="p-6 bg-card rounded-lg shadow-lg h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-text">대출 정보</h2>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1 text-sm font-semibold bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition"
        >
          대출 추가 +
        </button>
      </div>
      <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
        {loans.map((loan, index) => (
          <div
            key={loan.id}
            className="p-3 bg-background rounded-md border border-border"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold">대출 {index + 1}</h3>
              {loans.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(loan.id)}
                  className="text-xs text-secondary hover:text-red-500"
                >
                  삭제
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor={`loan_principal_${loan.id}`}
                  className="block text-xs font-medium text-secondary mb-1"
                >
                  대출금 (만원)
                </label>
                <input
                  id={`loan_principal_${loan.id}`}
                  name={`loan_principal_${loan.id}`}
                  type="number"
                  value={loan.principal}
                  onChange={(e) =>
                    onChange(loan.id, "principal", e.target.value)
                  }
                  placeholder="3000"
                  className="w-full text-sm pl-2 py-1.5 rounded-md border border-border focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label
                  htmlFor={`interest_rate_${loan.id}`}
                  className="block text-xs font-medium text-secondary mb-1"
                >
                  연이율 (%)
                </label>
                <input
                  id={`interest_rate_${loan.id}`}
                  name={`interest_rate_${loan.id}`}
                  type="number"
                  value={loan.interestRate}
                  onChange={(e) =>
                    onChange(loan.id, "interestRate", e.target.value)
                  }
                  step="0.01"
                  placeholder="5.5"
                  className="w-full text-sm pl-2 py-1.5 rounded-md border border-border focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 3. 월별 지출 섹션 (스타일 수정) ---
const MonthlyExpensesSection: React.FC = () => {
  const [consumptionType, setConsumptionType] = useState("amount");
  return (
    <div className="p-6 bg-card rounded-lg shadow-lg h-full">
      <h2 className="text-lg font-bold text-text mb-4">월별 고정 지출</h2>
      <div className="space-y-3">
        {/* 월별 소비금액 */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">
            월별 소비금액
          </label>
          <div className="flex items-center gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <input
                type="radio"
                id="consum_amount"
                name="consumption_type"
                value="amount"
                checked={consumptionType === "amount"}
                onChange={() => setConsumptionType("amount")}
                className="h-4 w-4 text-primary focus:ring-primary border-border"
              />
              <label htmlFor="consum_amount" className="text-sm">
                금액(만원)
              </label>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="radio"
                id="consum_percent"
                name="consumption_type"
                value="percentage"
                checked={consumptionType === "percentage"}
                onChange={() => setConsumptionType("percentage")}
                className="h-4 w-4 text-primary focus:ring-primary border-border"
              />
              <label htmlFor="consum_percent" className="text-sm">
                비율(%)
              </label>
            </div>
          </div>
          {consumptionType === "amount" ? (
            <input
              type="number"
              name="monthly_consumption"
              placeholder="150"
              className="w-full text-sm pl-2 py-1.5 rounded-md bg-background border border-border focus:ring-1"
            />
          ) : (
            <div>
              <input
                type="number"
                name="monthly_consumption_percentage"
                placeholder="40"
                className="w-full text-sm pl-2 py-1.5 rounded-md bg-background border border-border focus:ring-1"
              />
              <p className="text-xs text-secondary mt-1">
                ※ (월수입 - 보험료 - 대출상환액)의 %
              </p>
            </div>
          )}
        </div>
        {/* 월별 보험료, 적금, 상환액 */}
        <div>
          <label
            htmlFor="monthly_insurance"
            className="block text-xs font-medium text-secondary mb-1"
          >
            월별 보험료 (만원)
          </label>
          <input
            id="monthly_insurance"
            type="number"
            name="monthly_insurance"
            placeholder="20"
            className="w-full text-sm pl-2 py-1.5 rounded-md bg-background border border-border focus:ring-1"
          />
        </div>
        <div>
          <label
            htmlFor="monthly_savings"
            className="block text-xs font-medium text-secondary mb-1"
          >
            월별 적금 (만원)
          </label>
          <input
            id="monthly_savings"
            type="number"
            name="monthly_savings"
            placeholder="50"
            className="w-full text-sm pl-2 py-1.5 rounded-md bg-background border border-border focus:ring-1"
          />
        </div>
        <div>
          <label
            htmlFor="monthly_repayment"
            className="block text-xs font-medium text-secondary mb-1"
          >
            월별 원리금 상환액 (만원)
          </label>
          <input
            id="monthly_repayment"
            type="number"
            name="monthly_repayment"
            placeholder="100"
            className="w-full text-sm pl-2 py-1.5 rounded-md bg-background border border-border focus:ring-1"
          />
        </div>
      </div>
    </div>
  );
};

// --- 4. 개인 및 미래 계획 섹션 (스타일 수정) ---
const PlanningSection: React.FC = () => {
  const retirementAges = Array.from({ length: 6 }, (_, i) => 60 + i);
  return (
    <div className="p-6 bg-card rounded-lg shadow-lg h-full">
      <h2 className="text-lg font-bold text-text mb-4">미래 계획</h2>
      <div className="space-y-3">
        <div>
          <label
            htmlFor="dob"
            className="block text-xs font-medium text-secondary mb-1"
          >
            생년월일
          </label>
          <input
            id="dob"
            type="date"
            name="dob"
            className="w-full text-sm px-2 py-1.5 rounded-md bg-background border border-border focus:ring-1"
          />
        </div>
        <div>
          <label
            htmlFor="retirement_age"
            className="block text-xs font-medium text-secondary mb-1"
          >
            정년
          </label>
          <select
            id="retirement_age"
            name="retirement_age"
            className="w-full text-sm px-2 py-1.5 rounded-md bg-background border border-border focus:ring-1"
          >
            <option value="">선택</option>
            {retirementAges.map((age) => (
              <option key={age} value={age}>
                만 {age}세
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="peak_wage_period"
            className="block text-xs font-medium text-secondary mb-1"
          >
            임금피크 기간 (년)
          </label>
          <input
            id="peak_wage_period"
            type="number"
            name="peak_wage_period"
            placeholder="5"
            className="w-full text-sm pl-2 py-1.5 rounded-md bg-background border border-border focus:ring-1"
          />
        </div>
        <div>
          <label
            htmlFor="peak_wage_reduction_rate"
            className="block text-xs font-medium text-secondary mb-1"
          >
            임금피크 감소율 (%)
          </label>
          <input
            id="peak_wage_reduction_rate"
            type="number"
            name="peak_wage_reduction_rate"
            placeholder="10"
            step="0.1"
            className="w-full text-sm pl-2 py-1.5 rounded-md bg-background border border-border focus:ring-1"
          />
        </div>
      </div>
    </div>
  );
};

// --- 메인 폼 컴포넌트 ---
export default function InputForm() {
  const navigate = useNavigate();

  const [loans, setLoans] = useState<Loan[]>([
    { id: Date.now(), principal: "", interestRate: "" },
  ]);

  const addLoan = () => {
    setLoans([...loans, { id: Date.now(), principal: "", interestRate: "" }]);
  };

  const removeLoan = (id: number) => {
    setLoans(loans.filter((loan) => loan.id !== id));
  };

  const handleLoanChange = (
    id: number,
    field: keyof Omit<Loan, "id">,
    value: string
  ) => {
    setLoans(
      loans.map((loan) => (loan.id === id ? { ...loan, [field]: value } : loan))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // 월별 수입 정보를 배열로 재구성
    const monthlyIncomes = [];
    for (let i = 1; i <= 12; i++) {
      monthlyIncomes.push({
        month: i,
        income: formData.get(`monthly_income_${i}`) || "0",
        bonus: formData.get(`bonus_${i}`) || "0",
      });
    }

    // 서버로 보낼 전체 데이터 객체 생성
    const payload = {
      ...Object.fromEntries(formData.entries()),
      monthlyIncomes: monthlyIncomes,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      loans: loans.map(({ id, ...rest }) => rest),
    };

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/save-profile`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("데이터 저장에 실패했습니다.");
      }

      const result = await response.json();
      console.log("성공적으로 저장됨:", result);
      alert("데이터가 성공적으로 저장되었습니다!");
      if (result.id) {
        navigate(`/result/${result.id}`);
      }
    } catch (error) {
      console.error("클라이언트 오류:", error);
      alert("데이터 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <form
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        onSubmit={handleSubmit}
      >
        {/* -- 상단 -- */}
        <div className="lg:col-span-8">
          <IncomeSection />
        </div>
        <div className="lg:col-span-4">
          <MonthlyExpensesSection />
        </div>

        {/* -- 하단 -- */}
        <div className="lg:col-span-5">
          <PlanningSection />
        </div>
        <div className="lg:col-span-7">
          <LoanSection
            loans={loans}
            onAdd={addLoan}
            onRemove={removeLoan}
            onChange={handleLoanChange}
          />
        </div>

        {/* -- 버튼 -- */}
        <div className="lg:col-span-12 pt-2">
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-6 py-3 text-lg font-bold text-white shadow-md transition-all duration-200 ease-in-out hover:bg-primary/90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            완료
          </button>
        </div>
      </form>
    </div>
  );
}
