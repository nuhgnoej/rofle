import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// --- 타입 정의 ---
interface MonthlyData {
  year: number;
  month: number;
  income: number;
  bonus: number;
  totalLoanPayment: number;
  loanInterestPaid: number;
  loanPrincipalPaid: number;
  cumulativeSavings: number;
  disposableIncome: number;
  monthlyConsumption: number;
}

interface ProjectionSummary {
  retirementYear: number;
  finalAssets: number;
  finalLiabilities: number;
  totalInterestPaid: number;
}

interface ProjectionData {
  projection: MonthlyData[];
  summary: ProjectionSummary;
}

// --- 헬퍼 함수 ---
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return Math.round(value).toLocaleString(); // 소수점은 반올림 처리
};

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProjectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchProjectionData = async () => {
      try {
        setLoading(true);
        const apiUrl = `${
          import.meta.env.VITE_API_BASE_URL
        }/api/projection/${id}`;
        const response = await fetch(apiUrl);
        if (!response.ok)
          throw new Error("예측 데이터를 불러오는데 실패했습니다.");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectionData();
  }, [id]);

  if (loading)
    return (
      <div className="text-center p-10">
        미래 재무 상황을 예측하는 중입니다... 🤖
      </div>
    );
  if (error)
    return <div className="text-center p-10 text-red-500">오류: {error}</div>;
  if (!data)
    return <div className="text-center p-10">표시할 데이터가 없습니다.</div>;

  // 연도별로 데이터 그룹화
  const yearlyData = data.projection.reduce((acc, cur) => {
    (acc[cur.year] = acc[cur.year] || []).push(cur);
    return acc;
  }, {} as Record<number, MonthlyData[]>);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">
      <h1 className="text-3xl font-bold text-center mb-6">
        미래 재무 예측 결과
      </h1>

      {/* 5. 최종 요약 섹션 */}
      <section className="p-6 bg-blue-50 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-blue-800">
          정년({data.summary.retirementYear}년) 시점 재무 요약
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">예상 자산 (적금 총액)</p>
            <p className="text-2xl font-bold">
              {formatCurrency(data.summary.finalAssets)} 만원
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">잔여 부채 (대출 원금)</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(data.summary.finalLiabilities)} 만원
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">총 납부 이자</p>
            <p className="text-2xl font-bold">
              {formatCurrency(data.summary.totalInterestPaid)} 만원
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">순자산</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                data.summary.finalAssets - data.summary.finalLiabilities
              )}{" "}
              만원
            </p>
          </div>
        </div>
      </section>

      {/* 1-4. 연도별 상세 내역 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          연도별 상세 현금 흐름 (단위: 만원)
        </h2>
        <div className="space-y-8">
          {Object.keys(yearlyData).map((year) => (
            <div key={year}>
              <h3 className="text-lg font-bold bg-gray-100 p-2 rounded-t-md">
                {year}년
              </h3>
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2 border">월</th>
                    <th className="p-2 border text-right">월 총수입</th>
                    <th className="p-2 border text-right text-red-600">
                      상환 이자
                    </th>
                    <th className="p-2 border text-right text-orange-600">
                      상환 원금
                    </th>
                    <th className="p-2 border text-right text-blue-600">
                      누적 적금액
                    </th>
                    <th className="p-2 border text-right text-green-600">
                      월 가용금액
                    </th>
                    <th className="p-2 border text-right">월 소비금액</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData[Number(year)].map((monthData) => (
                    <tr key={monthData.month} className="hover:bg-gray-50">
                      <td className="p-2 border">{monthData.month}월</td>
                      <td className="p-2 border text-right">
                        {formatCurrency(monthData.income + monthData.bonus)}
                      </td>
                      <td className="p-2 border text-right">
                        {formatCurrency(monthData.loanInterestPaid)}
                      </td>
                      <td className="p-2 border text-right">
                        {formatCurrency(monthData.loanPrincipalPaid)}
                      </td>
                      <td className="p-2 border text-right">
                        {formatCurrency(monthData.cumulativeSavings)}
                      </td>
                      <td className="p-2 border text-right">
                        {formatCurrency(monthData.disposableIncome)}
                      </td>
                      <td className="p-2 border text-right">
                        {formatCurrency(monthData.monthlyConsumption)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
