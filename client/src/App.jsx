import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CardDetail from './pages/CardDetail';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cards/:id" element={<CardDetail />} />
      </Routes>
    </Layout>
  );
}

export default App;
