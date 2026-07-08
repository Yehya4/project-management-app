import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAuth } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import UserDashboard from './components/dashboards/UserDashboard';
import PMDashboard from './components/dashboards/PMDashboard';
import SponsorDashboard from './components/dashboards/SponsorDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import DeveloperDashboard from './components/dashboards/DeveloperDashboard';
import TesterDashboard from './components/dashboards/TesterDashboard';
import NouvelleDemandeSI from './pages/NouvelleDemandeSI';
import ListeDemandesSI from './pages/ListeDemandesSI';
import ProjectCharter from './pages/ProjectCharter';
import Projects from './pages/Projects';
import ProjectWorkspaceLayout from './components/ProjectWorkspaceLayout';
import ProjectOverview from './pages/project/ProjectOverview';
import ProjectTasks from './pages/project/ProjectTasks';
import ProjectTeam from './pages/project/ProjectTeam';
import ProjectBacklog from './pages/project/ProjectBacklog';
import ProjectDocuments from './pages/project/ProjectDocuments';
import ProjectRole from './pages/project/ProjectRole';
import ProjectInfo from './pages/project/ProjectInfo';
import ProjectCharterView from './pages/project/ProjectCharterView';
import ProjectMessages from './pages/project/ProjectMessages';
import ProjectCalendar from './pages/project/ProjectCalendar';
import UsersPage from './pages/UsersPage';
import Messages from './pages/Messages';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const DashboardRouter = () => {
  const { user } = useAuth();

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'User':
        return <UserDashboard />;
      case 'Project Manager':
        return <PMDashboard />;
      case 'Sponsor':
        return <SponsorDashboard />;
      case 'Admin':
        return <AdminDashboard />;
      case 'Developer':
        return <DeveloperDashboard />;
      case 'Tester':
        return <TesterDashboard />;
      default:
        return <div>Rôle non reconnu</div>;
    }
  };

  return (
    <Layout title={`Tableau de bord - ${user?.role}`}>
      {getDashboardContent()}
    </Layout>
  );
};

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <Routes>
                  <Route path="/demande-si" element={<ListeDemandesSI />} />
                  <Route path="/demande-si/nouvelle" element={<NouvelleDemandeSI />} />
                  <Route path="/demande-si/edit/:id" element={<NouvelleDemandeSI />} />
                  <Route path="/project-charter" element={<ProjectCharter />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectWorkspaceLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<ProjectOverview />} />
                    <Route path="charter" element={<ProjectCharterView />} />
                    <Route path="tasks" element={<ProjectTasks />} />
                    <Route path="team" element={<ProjectTeam />} />
                    <Route path="chat" element={<ProjectMessages />} />
                    <Route path="calendar" element={<ProjectCalendar />} />
                    <Route path="documents" element={<ProjectDocuments />} />
                    <Route path="backlog" element={<ProjectBacklog />} />
                    <Route path="role" element={<ProjectRole />} />
                    <Route path="project-info" element={<ProjectInfo />} />
                  </Route>
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/" element={<DashboardRouter />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
