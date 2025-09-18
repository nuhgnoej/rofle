import { useFormStore } from "../../stores/form.store";
import { useState, useEffect } from "react";

export default function ExpensesForm() {
  // 1. Zustand 스토어에서 필요한 상태와 액션을 개별적으로 구독
  const consumptionType = useFormStore((state) => state.consumptionType);
  const monthlyConsumptionValue = useFormStore(
    (state) => state.monthlyConsumptionValue
  );
  const monthlyRepayment = useFormStore((state) => state.monthlyRepayment);
  const monthlyInsurance = useFormStore((state) => state.monthlyInsurance);
  const monthlySavings = useFormStore((state) => state.monthlySavings);
  const setProfileData = useFormStore((state) => state.setProfileData);

  // 2. 라디오 버튼 제어를 위한 로컬 상태 (전역 상태에 영향을 주지 않음)
  const [localConsumptionType, setLocalConsumptionType] =
    useState(consumptionType);

  // 전역 상태가 바뀌면 로컬 상태도 동기화
  useEffect(() => {
    setLocalConsumptionType(consumptionType);
  }, [consumptionType]);

  // 3. 입력값 변경을 처리하는 핸들러
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({ [name]: parseInt(value, 10) || 0 });
  };

  const handleConsumptionTypeChange = (type: "AMOUNT" | "PERCENTAGE") => {
    setLocalConsumptionType(type);
    setProfileData({ consumptionType: type });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-text">월별 고정 지출</h2>
      <div className="space-y-6 max-w-sm">
        {/* 월별 소비금액 */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            월별 소비금액
          </label>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-1.5">
              <input
                type="radio"
                id="consum_amount"
                name="consumption_type"
                value="AMOUNT"
                checked={localConsumptionType === "AMOUNT"}
                onChange={() => handleConsumptionTypeChange("AMOUNT")}
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
                value="PERCENTAGE"
                checked={localConsumptionType === "PERCENTAGE"}
                onChange={() => handleConsumptionTypeChange("PERCENTAGE")}
              />
              <label htmlFor="consum_percent" className="text-sm">
                비율(%)
              </label>
            </div>
          </div>
          <input
            type="number"
            name="monthlyConsumptionValue"
            value={monthlyConsumptionValue || ""}
            onChange={handleNumericChange}
            placeholder={localConsumptionType === "AMOUNT" ? "150" : "40"}
            className="w-full text-sm p-2 rounded-md bg-background border"
          />
          {localConsumptionType === "PERCENTAGE" && (
            <p className="text-xs text-secondary mt-1">
              ※ (월 총수입 - 대출상환액 - 보험료)의 %
            </p>
          )}
        </div>

        {/* 월별 원리금 상환액 */}
        <div>
          <label
            htmlFor="monthlyRepayment"
            className="block text-sm font-medium text-secondary mb-1"
          >
            월별 원리금 상환액 (만원)
          </label>
          <input
            id="monthlyRepayment"
            name="monthlyRepayment"
            type="number"
            value={monthlyRepayment || ""}
            onChange={handleNumericChange}
            className="w-full text-sm p-2 rounded-md bg-background border"
          />
        </div>

        {/* 월별 보험료 */}
        <div>
          <label
            htmlFor="monthlyInsurance"
            className="block text-sm font-medium text-secondary mb-1"
          >
            월별 보험료 (만원)
          </label>
          <input
            id="monthlyInsurance"
            name="monthlyInsurance"
            type="number"
            value={monthlyInsurance || ""}
            onChange={handleNumericChange}
            className="w-full text-sm p-2 rounded-md bg-background border"
          />
        </div>

        {/* 월별 적금 */}
        <div>
          <label
            htmlFor="monthlySavings"
            className="block text-sm font-medium text-secondary mb-1"
          >
            월별 적금 (만원)
          </label>
          <input
            id="monthlySavings"
            name="monthlySavings"
            type="number"
            value={monthlySavings || ""}
            onChange={handleNumericChange}
            className="w-full text-sm p-2 rounded-md bg-background border"
          />
        </div>
      </div>
    </div>
  );
}
