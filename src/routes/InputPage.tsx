import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useFormStore } from "../stores/form.store";

const TABS = [
  { path: "/new", name: "미래 계획" },
  { path: "/new/income", name: "수입" },
  { path: "/new/expenses", name: "지출" },
  { path: "/new/loans", name: "대출" },
  { path: "/new/assets", name: "자산" },
];

export default function InputPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // [수정] 1. 렌더링 로직(탭 비활성화)에 필요한 데이터만 선택하여 구독합니다.
  const dob = useFormStore((state) => state.dob);
  const retirementAge = useFormStore((state) => state.retirementAge);
  const resetForm = useFormStore((state) => state.resetForm);

  const isPlanningComplete = !!(dob && retirementAge);

  const currentTabIndex =
    TABS.findIndex(
      (tab) => tab.path === location.pathname.replace(/\/$/, "")
    ) || 0;
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === TABS.length - 1;

  const handleNext = () => {
    if (!isLastTab) navigate(TABS[currentTabIndex + 1].path);
  };

  const handlePrev = () => {
    if (!isFirstTab) navigate(TABS[currentTabIndex - 1].path);
  };

  const handleSubmit = async () => {
    const formData = useFormStore.getState();

    const payload = {
      ...formData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      monthlyIncomes: formData.monthlyIncomes.map(({ id, ...rest }) => rest),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      loans: formData.loans.map(({ id, ...rest }) => rest),
      realEstateAssets: formData.realEstateAssets.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ id, ...rest }) => rest
      ),
    };

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/save-profile`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("데이터 저장에 실패했습니다.");
      }

      const result = await response.json();
      alert("성공적으로 저장되었습니다!");
      resetForm();
      navigate(`/result/${result.id}`);
    } catch (error) {
      console.error("제출 실패:", error);
      alert("데이터 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <nav className="flex border-b mb-8 overflow-x-auto">
        {TABS.map((tab, index) => {
          const isTabDisabled = index > 0 && !isPlanningComplete;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end
              onClick={(e) => {
                if (isTabDisabled) e.preventDefault();
              }}
              className={({ isActive }) =>
                `flex-shrink-0 px-4 py-2 font-semibold transition-colors 
                ${
                  isTabDisabled
                    ? "text-secondary/50 cursor-not-allowed"
                    : "text-secondary hover:text-text"
                }
                ${
                  isActive && !isTabDisabled
                    ? "border-b-2 border-primary text-primary"
                    : ""
                }`
              }
            >
              {tab.name}
            </NavLink>
          );
        })}
      </nav>

      <main className="py-8 min-h-[300px]">
        <Outlet />
      </main>

      <div className="mt-8 flex justify-between items-center border-t pt-6">
        <button
          onClick={handlePrev}
          disabled={isFirstTab}
          className="px-6 py-2 rounded-md bg-secondary/20 text-text disabled:opacity-50 transition-opacity"
        >
          이전
        </button>
        {isLastTab ? (
          <button
            onClick={handleSubmit}
            disabled={!isPlanningComplete}
            className="px-8 py-2 rounded-md bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:bg-secondary/50"
          >
            분석 완료
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!isPlanningComplete}
            className="px-6 py-2 rounded-md bg-secondary/20 text-text disabled:opacity-50 transition-opacity"
          >
            다음
          </button>
        )}
      </div>
    </div>
  );
}
