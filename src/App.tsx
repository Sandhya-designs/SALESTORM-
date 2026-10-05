import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { OverviewPage } from './pages/OverviewPage';
import { FlashSalePage } from './pages/FlashSalePage';
import { InventoryPage } from './pages/InventoryPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { OrdersPage } from './pages/OrdersPage';
import { FailuresPage } from './pages/FailuresPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { ObservabilityPage } from './pages/ObservabilityPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="flash-sale" element={<FlashSalePage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="failures" element={<FailuresPage />} />
          <Route path="architecture" element={<ArchitecturePage />} />
          <Route path="observability" element={<ObservabilityPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
