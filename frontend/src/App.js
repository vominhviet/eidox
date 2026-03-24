import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CameraManagement from './components/CameraManagement';
import ZoneDrawingPage from './components/ZoneDrawingPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/cameras" />} />
          <Route path="/cameras" element={<CameraManagement />} />
          <Route path="/draw-zone" element={<ZoneDrawingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;