import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TopicProvider } from './context/TopicContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AddTopic from './pages/AddTopic';
import AllTopics from './pages/AllTopics';
import Revision from './pages/Revision';
import Analytics from './pages/Analytics';

function App() {
  return (
    <TopicProvider>
      <Router>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add" element={<AddTopic />} />
              <Route path="/topics" element={<AllTopics />} />
              <Route path="/revision" element={<Revision />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </main>
        </div>
      </Router>
    </TopicProvider>
  );
}

export default App;
