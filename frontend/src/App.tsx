import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar/Navbar';
import { GamePage } from './pages/GamePage';
import { TrainingPage } from './pages/TrainingPage';

export function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/training" element={<TrainingPage />} />
        </Routes>
      </main>
    </div>
  );
}
