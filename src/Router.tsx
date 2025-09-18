import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import InputPage from "./routes/InputPage";
import ResultPage from "./routes/ResultPage";
import ListPage from "./routes/ListPage";

// 폼 컴포넌트들
import IncomeForm from "./routes/forms/IncomeForm";
import ExpensesForm from "./routes/forms/ExpensesForm";
import PlanningForm from "./routes/forms/PlanningForm";
import LoanForm from "./routes/forms/LoanForm";
import AssetForm from "./routes/forms/AssetForm";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "",
        element: <ListPage />,
      },
      {
        path: "new",
        element: <InputPage />,
        children: [
          { index: true, element: <PlanningForm /> },
          { path: "income", element: <IncomeForm /> },
          { path: "expenses", element: <ExpensesForm /> },
          { path: "loans", element: <LoanForm /> },
          { path: "assets", element: <AssetForm /> },
        ],
      },
      { path: "result/:id", element: <ResultPage /> },
    ],
  },
]);

export default router;
