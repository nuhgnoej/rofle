import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// --- 데이터 타입을 미리 정의해두면 편리합니다 ---
interface MonthlyIncome {
  month: number;
  income: number | null;
  bonus: number | null;
}

interface Loan {
  principal: number | null;
  interestRate: number | null;
}

interface ProfileData {
  id: string;
  dob: string;
  retirementAge: number | null;
  peakWagePeriod: number | null;
  peakWageReductionRate: number | null;
  monthlyConsumptionValue: number | null;
  monthlyInsurance: number | null;
  monthlySavings: number | null;
  monthlyRepayment: number | null;
  monthlyIncomes: MonthlyIncome[];
  loans: Loan[];
}

// --- 숫자를 화폐 형식(,)으로 변환하는 헬퍼 함수 ---
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString();
};

export default function ResultPage() {
  // URL의 파라미터에서 id를 가져옵니다 (예: /result/clxnyg7a00000123abcd)
  const { id } = useParams<{ id: string }>();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/profile/${id}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error("데이터를 불러오는데 실패했습니다.");
        }
        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]); // id가 변경될 때마다 데이터를 다시 불러옵니다.

  if (loading) {
    return (
      <div className="text-center p-10">데이터를 불러오는 중입니다...</div>
    );
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">오류: {error}</div>;
  }

  if (!profileData) {
    return <div className="text-center p-10">표시할 데이터가 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 bg-gray-50 rounded-lg">
      <h1 className="text-3xl font-bold text-center mb-6">입력 결과 확인</h1>

      {/* 미래 계획 */}
      <section>
        <h2 className="text-2xl font-semibold border-b-2 pb-2 mb-4">
          미래 계획
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <p>
            <strong>생년월일:</strong>{" "}
            {new Date(profileData.dob).toLocaleDateString()}
          </p>
          <p>
            <strong>정년:</strong> 만 {profileData.retirementAge || "-"}세
          </p>
          <p>
            <strong>임금피크 기간:</strong> {profileData.peakWagePeriod || "-"}
            년
          </p>
          <p>
            <strong>임금피크 감소율:</strong>{" "}
            {profileData.peakWageReductionRate || "-"}%
          </p>
        </div>
      </section>

      {/* 월별 고정 지출 */}
      <section>
        <h2 className="text-2xl font-semibold border-b-2 pb-2 mb-4">
          월별 고정 지출 (단위: 만원)
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <p>
            <strong>월별 소비금액:</strong>{" "}
            {formatCurrency(profileData.monthlyConsumptionValue)}
          </p>
          <p>
            <strong>월별 보험료:</strong>{" "}
            {formatCurrency(profileData.monthlyInsurance)}
          </p>
          <p>
            <strong>월별 적금:</strong>{" "}
            {formatCurrency(profileData.monthlySavings)}
          </p>
          <p>
            <strong>월별 원리금 상환액:</strong>{" "}
            {formatCurrency(profileData.monthlyRepayment)}
          </p>
        </div>
      </section>

      {/* 연간 수입 정보 */}
      <section>
        <h2 className="text-2xl font-semibold border-b-2 pb-2 mb-4">
          연간 수입 정보 (단위: 만원)
        </h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">월</th>
              <th className="p-2 border text-right">월수입</th>
              <th className="p-2 border text-right">보너스</th>
            </tr>
          </thead>
          <tbody>
            {profileData.monthlyIncomes.map((inc) => (
              <tr key={inc.month} className="hover:bg-gray-100">
                <td className="p-2 border">{inc.month}월</td>
                <td className="p-2 border text-right">
                  {formatCurrency(inc.income)}
                </td>
                <td className="p-2 border text-right">
                  {formatCurrency(inc.bonus)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 대출 정보 */}
      <section>
        <h2 className="text-2xl font-semibold border-b-2 pb-2 mb-4">
          대출 정보
        </h2>
        {profileData.loans.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">대출금 (만원)</th>
                <th className="p-2 border">연이율 (%)</th>
              </tr>
            </thead>
            <tbody>
              {profileData.loans.map((loan, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="p-2 border text-right">
                    {formatCurrency(loan.principal)}
                  </td>
                  <td className="p-2 border text-right">
                    {loan.interestRate || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>입력된 대출 정보가 없습니다.</p>
        )}
      </section>
    </div>
  );
}
