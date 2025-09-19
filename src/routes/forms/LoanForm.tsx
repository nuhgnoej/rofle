import { useFormStore } from "../../stores/form.store";
import type { Loan } from "../../types";

export default function LoanForm() {
  const loans = useFormStore((state) => state.loans);
  const setProfileData = useFormStore((state) => state.setProfileData);

  const addLoan = () => {
    const newLoans: Loan[] = [
      ...loans, // ✨ name, type, termInYears 필드를 추가합니다.
      {
        id: Date.now().toString(),
        name: "",
        type: "",
        principal: 0,
        interestRate: 0,
        termInYears: 0,
        gracePeriodInYears: 0,
        paymentMethod: "",
      },
    ];
    setProfileData({ loans: newLoans });
  };

  const removeLoan = (id: string) => {
    const newLoans = loans.filter((loan) => loan.id !== id);
    setProfileData({ loans: newLoans });
  };

  const handleLoanChange = (id: string, field: keyof Loan, value: string) => {
    const newLoans = loans.map((loan) => {
      if (loan.id === id) {
        let updatedValue: string | number = value;

        if (
          field === "principal" ||
          field === "interestRate" ||
          field === "termInYears" ||
          field === "gracePeriodInYears"
        ) {
          updatedValue = parseFloat(value) || 0;
        }

        return { ...loan, [field]: updatedValue };
      }
      return loan;
    });
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
                {" "}
                <label
                  htmlFor={`loan_name_${loan.id}`}
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  대출 이름{" "}
                </label>{" "}
                <input
                  id={`loan_name_${loan.id}`}
                  type="text"
                  value={loan.name || ""}
                  onChange={(e) =>
                    handleLoanChange(loan.id, "name", e.target.value)
                  }
                  placeholder="주택 담보 대출"
                  className="w-full text-sm p-2 rounded-md border"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label
                  htmlFor={`loan_type_${loan.id}`}
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  대출 유형{" "}
                </label>{" "}
                <select
                  id={`loan_type_${loan.id}`}
                  value={loan.type || ""}
                  onChange={(e) =>
                    handleLoanChange(loan.id, "type", e.target.value)
                  }
                  className="w-full text-sm p-2 rounded-md border bg-background"
                >
                  <option value="신용 대출">신용 대출</option>
                  <option value="담보 대출">담보 대출</option>
                  <option value="기타 대출">기타 대출</option>
                </select>
              </div>
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
              <div>
                <label
                  htmlFor={`loan_term_${loan.id}`}
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  대출기간 (년)
                </label>
                <input
                  id={`loan_term_${loan.id}`}
                  type="number"
                  value={loan.termInYears || ""}
                  onChange={(e) =>
                    handleLoanChange(loan.id, "termInYears", e.target.value)
                  }
                  placeholder="0"
                  className="w-full text-sm p-2 rounded-md border"
                />
              </div>
              {/* 💡 거치기간 입력 필드 추가 */}
              <div>
                <label
                  htmlFor={`loan_grace_period_${loan.id}`}
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  거치기간 (년)
                </label>
                <input
                  id={`loan_grace_period_${loan.id}`}
                  type="number"
                  value={loan.gracePeriodInYears || ""}
                  onChange={(e) =>
                    handleLoanChange(
                      loan.id,
                      "gracePeriodInYears",
                      e.target.value
                    )
                  }
                  placeholder="0"
                  className="w-full text-sm p-2 rounded-md border"
                />
              </div>
              <div>
                <label
                  htmlFor={`loan_method_${loan.id}`}
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  상환방식
                </label>
                <select
                  id={`loan_method_${loan.id}`}
                  value={loan.paymentMethod || ""}
                  onChange={(e) =>
                    handleLoanChange(loan.id, "paymentMethod", e.target.value)
                  }
                  className="w-full text-sm p-2 rounded-md border bg-background"
                >
                  <option value="">선택</option>
                  <option value="원리금균등">원리금균등</option>
                  <option value="원금균등">원금균등</option>
                  <option value="만기일시">만기일시</option>
                  <option value="자유상환(모델자동계산)">
                    자유상환(모델자동계산)
                  </option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
