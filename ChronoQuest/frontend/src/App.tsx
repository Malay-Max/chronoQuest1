
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Timeline from './pages/Timeline';
import AddNotes from './pages/AddNotes';
import TrainingMode from './pages/TrainingMode';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Timeline />} />
          <Route path="/add" element={<AddNotes />} />
          <Route path="/train" element={<TrainingMode />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
