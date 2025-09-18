import { useFormStore } from "../../stores/form.store";
import type { Loan } from "../../types";

export default function LoanForm() {
  const loans = useFormStore((state) => state.loans);
  const setProfileData = useFormStore((state) => state.setProfileData);

  const addLoan = () => {
    const newLoans: Loan[] = [
      ...loans,
      { id: Date.now().toString(), principal: 0, interestRate: 0 },
    ];
    setProfileData({ loans: newLoans });
  };

  const removeLoan = (id: string) => {
    const newLoans = loans.filter((loan) => loan.id !== id);
    setProfileData({ loans: newLoans });
  };

  const handleLoanChange = (
    id: string,
    field: "principal" | "interestRate",
    value: string
  ) => {
    const newLoans = loans.map((loan) =>
      loan.id === id ? { ...loan, [field]: parseFloat(value) || 0 } : loan
    );
    setProfileData({ loans: newLoans });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text">대출 정보</h2>
        <button
          type="button"
          onClick={addLoan}
          className="px-4 py-2 text-sm font-semibold bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition"
        >
          대출 추가 +
        </button>
      </div>
      <div className="space-y-4">
        {loans.map((loan, index) => (
          <div key={loan.id} className="p-4 bg-background rounded-md border">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-bold">대출 {index + 1}</h3>
              {/* loans 배열에 항목이 하나만 남았을 때 삭제 버튼 숨기기 */}
              {loans.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLoan(loan.id)}
                  className="text-sm text-secondary hover:text-danger"
                >
                  삭제
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`loan_principal_${loan.id}`}
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  대출금 (만원)
                </label>
                <input
                  id={`loan_principal_${loan.id}`}
                  type="number"
                  value={loan.principal || ""}
                  onChange={(e) =>
                    handleLoanChange(loan.id, "principal", e.target.value)
                  }
                  placeholder="3000"
                  className="w-full text-sm p-2 rounded-md border"
                />
              </div>
              <div>
                <label
                  htmlFor={`interest_rate_${loan.id}`}
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  연이율 (%)
                </label>
                <input
                  id={`interest_rate_${loan.id}`}
                  type="number"
                  step="0.01"
                  value={loan.interestRate || ""}
                  onChange={(e) =>
                    handleLoanChange(loan.id, "interestRate", e.target.value)
                  }
                  placeholder="5.5"
                  className="w-full text-sm p-2 rounded-md border"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
