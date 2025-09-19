import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type {
  ProfileData,
  ProjectionData,
  MonthlyData,
  ProjectedData,
} from "../types";

interface OverrideData {
  income: number | null;
  monthlyConsumption: number | null;
}

interface YearlyOverrides {
  [year: number]: {
    [month: number]: OverrideData;
  };
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return Math.round(value).toLocaleString();
};

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();

  const [profileInputs, setProfileInputs] = useState<ProfileData | null>(null);
  const [projectionData, setProjectionData] = useState<ProjectionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchAndDisplayProjection = async () => {
      try {
        setLoading(true);
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/profile/${id}`;
        const response = await fetch(apiUrl);

        if (!response.ok) throw new Error("데이터를 불러오는데 실패했습니다.");
        const result = await response.json();

        // 서버 응답에서 projectedData와 summary를 직접 사용
        const projectedDataArray = result.projectedData || [];
        const summary = result.summary || {}; // summary 객체는 API 응답에 포함되어야 함

        const overrides = projectedDataArray.reduce(
          (acc: YearlyOverrides, cur: ProjectedData) => {
            if (cur.isOverridden) {
              acc[cur.year] = acc[cur.year] || {};
              acc[cur.year][cur.month] = {
                income: cur.income,
                monthlyConsumption: cur.monthlyConsumption,
              };
            }
            return acc;
          },
          {} as YearlyOverrides
        );

        setProfileInputs({
          ...result,
          overrides: overrides,
          monthlyIncomes: result.monthlyIncomes || [],
        });

        // projectedData와 summary를 상태에 설정
        setProjectionData({
          projection: projectedDataArray,
          summary: summary,
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchAndDisplayProjection();
  }, [id]);

  const handleMonthlyDataChange = (
    year: number,
    month: number,
    field: "income" | "monthlyConsumption",
    value: string
  ) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue < 0) return;

    setProfileInputs((currentInputs) => {
      if (!currentInputs) return null;
      const newInputs = JSON.parse(JSON.stringify(currentInputs));

      if (!newInputs.overrides) newInputs.overrides = {};
      if (!newInputs.overrides[year]) newInputs.overrides[year] = {};
      if (!newInputs.overrides[year][month])
        newInputs.overrides[year][month] = {};

      newInputs.overrides[year][month][field] = numericValue;
      return newInputs;
    });
  };

  if (loading)
    return (
      <div className="text-center p-10">
        미래 재무 상황을 예측하는 중입니다... 🤖
      </div>
    );
  if (error)
    return <div className="text-center p-10 text-red-500">오류: {error}</div>;
  if (!projectionData)
    return <div className="text-center p-10">표시할 데이터가 없습니다.</div>;

  const yearlyData = projectionData.projection.reduce((acc, cur) => {
    (acc[cur.year] = acc[cur.year] || []).push(cur);
    return acc;
  }, {} as Record<number, MonthlyData[]>);

  return (
    <div className="w-full py-10">
      <div className="max-w-6xl mx-auto p-8 space-y-10 bg-content-background rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-text">
          미래 재무 예측 결과
        </h1>

        {/* --- 최종 요약 섹션 --- */}
        <section className="p-6 bg-accent rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            정년({projectionData.summary.retirementYear}년) 시점 재무 요약
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-secondary">예상 자산 (적금+부동산)</p>
              <p className="text-2xl font-bold text-text">
                {formatCurrency(projectionData.summary.finalAssets)} 만원
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary">잔여 부채 (대출 원금)</p>
              <p className="text-2xl font-bold text-danger">
                {formatCurrency(projectionData.summary.finalLiabilities)} 만원
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary">총 납부 이자</p>
              <p className="text-2xl font-bold text-text">
                {formatCurrency(projectionData.summary.totalInterestPaid)} 만원
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary">순자산</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(
                  projectionData.summary.finalAssets -
                    projectionData.summary.finalLiabilities
                )}{" "}
                만원
              </p>
            </div>
          </div>
        </section>

        {/* --- 연도별 상세 내역 --- */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-text">
            연도별 상세 현금 흐름 (단위: 만원)
          </h2>
          <div className="space-y-8">
            {Object.keys(yearlyData).map((yearStr) => {
              const year = Number(yearStr);
              return (
                <div key={year}>
                  <h3 className="text-lg font-bold bg-accent text-primary p-2 rounded-t-md">
                    {year}년
                  </h3>
                  <table className="w-full text-sm text-left border-collapse text-secondary">
                    <thead className="bg-accent/50 text-text">
                      <tr>
                        <th className="p-2 border font-semibold">월</th>
                        <th className="p-2 border font-semibold text-right">
                          월 총수입
                        </th>
                        <th className="p-2 border font-semibold text-right text-danger">
                          상환 이자
                        </th>
                        <th className="p-2 border font-semibold text-right text-warning">
                          상환 원금
                        </th>
                        <th className="p-2 border font-semibold text-right">
                          월 소비금액
                        </th>
                        <th className="p-2 border font-semibold text-right text-primary">
                          누적 적금액
                        </th>
                        {/* --- [추가] 부동산 가액 헤더 --- */}
                        <th className="p-2 border font-semibold text-right text-success">
                          부동산 가액
                        </th>
                        {/* --- [추가] 총 자산 헤더 --- */}
                        <th className="p-2 border font-semibold text-right text-success">
                          총 자산
                        </th>
                        <th className="p-2 border font-semibold text-right text-success">
                          월 가용금액
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearlyData[year].map((monthData) => (
                        <tr
                          key={monthData.month}
                          className={`${
                            monthData.isOverridden
                              ? "bg-yellow-100 dark:bg-yellow-900/30"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700/20"
                          }`}
                        >
                          <td className="p-2 border">{monthData.month}월</td>
                          <td className="p-2 border">
                            <input
                              type="number"
                              defaultValue={Math.round(
                                monthData.income + monthData.bonus
                              )}
                              onBlur={(e) =>
                                handleMonthlyDataChange(
                                  year,
                                  monthData.month,
                                  "income",
                                  e.target.value
                                )
                              }
                              className="w-full text-right bg-transparent focus:outline-none focus:bg-yellow-50 dark:focus:bg-yellow-800/30 rounded px-1"
                            />
                          </td>
                          <td className="p-2 border text-right">
                            {formatCurrency(monthData.loanInterestPaid)}
                          </td>
                          <td className="p-2 border text-right">
                            {formatCurrency(monthData.loanPrincipalPaid)}
                          </td>
                          <td className="p-2 border">
                            <input
                              type="number"
                              defaultValue={Math.round(
                                monthData.monthlyConsumption
                              )}
                              onBlur={(e) =>
                                handleMonthlyDataChange(
                                  year,
                                  monthData.month,
                                  "monthlyConsumption",
                                  e.target.value
                                )
                              }
                              className="w-full text-right bg-transparent focus:outline-none focus:bg-yellow-50 dark:focus:bg-yellow-800/30 rounded px-1"
                            />
                          </td>
                          <td className="p-2 border text-right">
                            {formatCurrency(monthData.cumulativeSavings)}
                          </td>
                          {/* --- [추가] 부동산 가액 셀 --- */}
                          <td className="p-2 border text-right">
                            {formatCurrency(monthData.realEstateValue)}
                          </td>
                          {/* --- [추가] 총 자산 셀 --- */}
                          <td className="p-2 border text-right">
                            {formatCurrency(monthData.totalAssets)}
                          </td>
                          <td className="p-2 border text-right">
                            {formatCurrency(monthData.disposableIncome)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
