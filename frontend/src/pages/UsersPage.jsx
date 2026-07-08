import React from 'react';
import Layout from '../components/Layout';
import UserManagement from '../components/dashboards/UserManagement';

const UsersPage = () => {
  return (
    <Layout title="Gestion des Utilisateurs">
      <div className="max-w-7xl mx-auto w-full">
        <UserManagement isModal={false} />
      </div>
    </Layout>
  );
};

export default UsersPage;
