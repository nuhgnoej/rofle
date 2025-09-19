import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type {
  ProfileWithProjection,
  MonthlyData,
  ProjectedLoanState,
  Loan,
} from "../types";

// 💡 새로운 타입: 오버라이드 데이터
// interface OverrideData {
//   income: number | null;
//   monthlyConsumption: number | null;
// }

// 💡 새로운 타입: 연도별 오버라이드
// interface YearlyOverrides {
//   [year: number]: {
//     [month: number]: OverrideData;
//   };
// }

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return Math.round(value).toLocaleString();
};

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();

  // 💡 상태 변수 변경: ProfileWithProjection 타입 사용
  const [profileData, setProfileData] = useState<ProfileWithProjection | null>(
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
        const result: ProfileWithProjection = await response.json();

        // 💡 서버에서 받아온 데이터를 그대로 상태에 저장
        setProfileData(result);
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
    // 💡 오버라이드 로직은 백엔드에서 처리하므로, 여기서는 단순히 HTTP 요청을 보냅니다.
    // 이 로직은 백엔드 API가 준비되면 구현할 수 있습니다. 현재는 그대로 유지합니다.
    alert("아직 구현 중...");
    console.log(year, month, field, value);
  };

  if (loading)
    return (
      <div className="text-center p-10">
        미래 재무 상황을 예측하는 중입니다... 🤖
      </div>
    );
  if (error)
    return <div className="text-center p-10 text-red-500">오류: {error}</div>;
  if (!profileData)
    return <div className="text-center p-10">표시할 데이터가 없습니다.</div>;

  // 💡 데이터 가공: 월별 총합 데이터를 연도별로 그룹화
  const yearlyData = profileData.projectedData.reduce((acc, cur) => {
    (acc[cur.year] = acc[cur.year] || []).push(cur);
    return acc;
  }, {} as Record<number, MonthlyData[]>);

  // 💡 데이터 가공: 월별 개별 대출 상태 데이터를 연도, 월별로 그룹화
  const yearlyLoanData = profileData.projectedLoanStates.reduce((acc, cur) => {
    acc[cur.year] = acc[cur.year] || {};
    (acc[cur.year][cur.month] = acc[cur.year][cur.month] || []).push(cur);
    return acc;
  }, {} as Record<number, Record<number, ProjectedLoanState[]>>);

  const loanMap = new Map<string, Loan>();
  profileData.loans.forEach((loan) => loanMap.set(loan.id, loan));

  return (
    <div className="w-full py-10">
      <div className="max-w-6xl mx-auto p-8 space-y-10 bg-content-background rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-text">
          미래 재무 예측 결과
        </h1>

        {/* --- 최종 요약 섹션 --- */}
        <section className="p-6 bg-accent rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            정년({profileData.summary.retirementYear}년) 시점 재무 요약
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-secondary">예상 자산 (적금+부동산)</p>
              <p className="text-2xl font-bold text-text">
                {formatCurrency(profileData.summary.finalAssets)} 만원
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary">잔여 부채 (대출 원금)</p>
              <p className="text-2xl font-bold text-danger">
                {formatCurrency(profileData.summary.finalLiabilities)} 만원
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary">총 납부 이자</p>
              <p className="text-2xl font-bold text-text">
                {formatCurrency(profileData.summary.totalInterestPaid)} 만원
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary">순자산</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(
                  profileData.summary.finalAssets -
                    profileData.summary.finalLiabilities
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
                    {year}년 (
                    {profileData && profileData.dob
                      ? year - new Date(profileData.dob).getFullYear()
                      : "-"}
                    세)
                  </h3>
                  <table className="w-full text-sm text-left border-collapse text-secondary">
                    <thead className="bg-accent/50 text-text">
                      <tr>
                        <th
                          rowSpan={2}
                          className="p-2 border font-semibold align-middle text-center"
                        >
                          월
                        </th>
                        <th
                          colSpan={5}
                          className="p-2 border font-semibold text-center"
                        >
                          월별 현금 흐름
                        </th>
                        <th
                          colSpan={4}
                          className="p-2 border font-semibold text-center"
                        >
                          월말 자산 및 부채
                        </th>
                      </tr>
                      <tr>
                        <th className="p-2 border font-semibold text-right">
                          총 수입
                        </th>
                        <th className="p-2 border font-semibold text-right text-danger">
                          총 상환 이자
                        </th>
                        <th className="p-2 border font-semibold text-right text-warning">
                          총 상환 원금
                        </th>
                        <th className="p-2 border font-semibold text-right">
                          월 소비금액
                        </th>
                        <th className="p-2 border font-semibold text-right text-success">
                          월 가용금액
                        </th>
                        <th className="p-2 border font-semibold text-right text-success">
                          총 대출 잔액
                        </th>
                        <th className="p-2 border font-semibold text-right text-success">
                          부동산 가액
                        </th>
                        <th className="p-2 border font-semibold text-right text-success">
                          누적 적금액
                        </th>
                        <th className="p-2 border font-semibold text-right text-success">
                          총 자산
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearlyData[year].map((monthData) => (
                        <>
                          <tr
                            key={monthData.month}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/20"
                          >
                            <td className="p-2 border">{monthData.month}월</td>
                            <td className="p-2 border text-right">
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
                              {formatCurrency(monthData.loanInterestPaidTotal)}
                            </td>
                            <td className="p-2 border text-right">
                              {formatCurrency(monthData.loanPrincipalPaidTotal)}
                            </td>
                            <td className="p-2 border text-right">
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
                              {formatCurrency(monthData.disposableIncome)}
                            </td>
                            <td className="p-2 border text-right">
                              <span
                                style={{
                                  color:
                                    (monthData.remainingLoanPrincipalTotal ||
                                      0) > 0
                                      ? "red"
                                      : "green",
                                }}
                              >
                                {formatCurrency(
                                  monthData.remainingLoanPrincipalTotal
                                )}
                              </span>
                            </td>
                            <td className="p-2 border text-right">
                              {formatCurrency(monthData.realEstateValue)}
                            </td>
                            <td className="p-2 border text-right">
                              {formatCurrency(monthData.cumulativeSavings)}
                            </td>
                            <td className="p-2 border text-right">
                              {formatCurrency(monthData.totalAssets)}
                            </td>
                          </tr>
                          {/* 💡 개별 대출 정보 표시 로직 */}
                          {yearlyLoanData[year] &&
                            yearlyLoanData[year][monthData.month] && (
                              <tr className="bg-gray-100 dark:bg-gray-800">
                                <td
                                  colSpan={10}
                                  className="p-2 border-l border-r"
                                >
                                  <div className="pl-4">
                                    <h4 className="font-semibold text-sm mb-1 text-primary">
                                      개별 대출 내역
                                    </h4>
                                    <ul className="list-disc list-inside space-y-1">
                                      {yearlyLoanData[year][
                                        monthData.month
                                      ].map((loanState) => (
                                        <li
                                          key={loanState.loanId}
                                          className="flex justify-between items-center text-xs"
                                        >
                                          <span className="font-medium text-text">
                                            {loanMap.get(loanState.loanId)
                                              ?.name || "알 수 없는 대출"}
                                          </span>
                                          <span className="text-secondary">
                                            이자:{" "}
                                            {formatCurrency(
                                              loanState.interestPaid
                                            )}
                                            만 / 원금:{" "}
                                            {formatCurrency(
                                              loanState.principalPaid
                                            )}
                                            만 / 잔액:{" "}
                                            {formatCurrency(
                                              loanState.remainingPrincipal
                                            )}
                                            만
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </td>
                              </tr>
                            )}
                        </>
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
