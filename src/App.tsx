import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Subscriptions from "@/pages/Subscriptions";
import AddEdit from "@/pages/AddEdit";
import Insights from "@/pages/Insights";
import Share from "@/pages/Share";
import SettingsPage from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <div className="mx-auto max-w-md w-full min-h-screen bg-white shadow-xl relative overflow-hidden">
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/add" element={<AddEdit />} />
            <Route path="/edit/:id" element={<AddEdit />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/share" element={<Share />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}