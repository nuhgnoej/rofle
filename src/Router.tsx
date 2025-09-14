import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import InputPage from "./routes/InputPage";
import ResultPage from "./routes/ResultPage";
import ListPage from "./routes/ListPage";

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
      },
      { path: "result/:id", element: <ResultPage /> },
    ],
  },
]);

export default router;
