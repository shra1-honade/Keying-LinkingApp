import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Runs from './pages/Runs';
import NewRun from './pages/NewRun';
import Analysis from './pages/Analysis';
import Configs from './pages/Configs';
import Preferences from './pages/Preferences';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="runs" element={<Runs />} />
          <Route path="runs/new" element={<NewRun />} />
          <Route path="runs/:runId/analysis" element={<Analysis />} />
          <Route path="configs" element={<Configs />} />
          <Route path="preferences" element={<Preferences />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
