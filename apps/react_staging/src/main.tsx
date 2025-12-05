import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "virtual:uno.css";
import App from "./App.tsx";
import "@ant-design/v5-patch-for-react-19";
import { Provider } from "react-redux";
import store from "./app/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
