import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Activity from './Activity';
import Alerts from './Alerts';
import Automation from './Automation';
import Devices from './Devices';
import Guide from './Guide';
import Layout from './Layout';
import Maintenance from './Maintenance';
import Overview from './Overview';
import Sections from './Sections';

export default function AdminDashboard() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'მიკორიზა | ოპერატორის პანელი';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="sections" element={<Sections />} />
        <Route path="devices" element={<Devices />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="automation" element={<Automation />} />
        <Route path="activity" element={<Activity />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="guide" element={<Guide />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
