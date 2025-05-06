import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './Popup';
import '../styles/tailwind.css';

const container = document.getElementById('app');
if (!container) throw new Error('Container element not found');

const root = createRoot(container);
root.render(<Popup />);