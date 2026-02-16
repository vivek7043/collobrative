import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';
import { NotificationProvider } from './context/NotificationContext';

function App() {
    return (
        <NotificationProvider>
            <div className="app-container">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/room/:id" element={<Room />} />
                </Routes>
            </div>
        </NotificationProvider>
    );
}

export default App;
