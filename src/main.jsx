import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AppProvider } from "./context/AppState";
import { ToastProvider } from "./context/Toast";
import { ConfirmProvider } from "./context/Confirm";
import { SandiUlangProvider } from "./context/SandiUlang";

// Router berbasis data diperlukan agar perpindahan halaman bisa dicegat
// (peringatan "perubahan belum disimpan"). Seluruh rute tetap didefinisikan di App.jsx.
const router = createBrowserRouter([{ path: "*", element: <App /> }]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <SandiUlangProvider>
        <ConfirmProvider>
          <AppProvider>
            <RouterProvider router={router} />
          </AppProvider>
        </ConfirmProvider>
      </SandiUlangProvider>
    </ToastProvider>
  </StrictMode>
);