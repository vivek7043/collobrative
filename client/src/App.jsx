import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';

function App() {
    return (
        <div className="app-container">
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/room/:id" element={<Room />} />
            </Routes>
        </div>
    );
}

export default App;
