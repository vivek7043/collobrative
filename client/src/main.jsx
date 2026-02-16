import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

import { Buffer } from 'buffer';
window.global = window;
window.process = { env: { DEBUG: undefined }, nextTick: (cb) => setTimeout(cb, 0) };
window.Buffer = Buffer;

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
    </BrowserRouter>,
)
