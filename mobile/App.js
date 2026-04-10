// React Native Mobile App - App.js
// This is a starter template for the mobile version of AgentFlow
// Uses the same backend APIs as the web app

import React, { useState, useEffect } from 'react';

/*
  REACT NATIVE MOBILE APP SETUP
  ==============================
  
  To set up the mobile app:
  
  1. Install React Native CLI:
     npm install -g @react-native-community/cli
  
  2. Create the project:
     npx react-native init AgentFlowMobile
  
  3. Install dependencies:
     npm install @react-navigation/native @react-navigation/stack
     npm install axios
     npm install @react-native-async-storage/async-storage
     npm install react-native-vector-icons
     npm install socket.io-client
  
  4. Copy the API service (api.js) and modify the baseURL to point
     to your backend server IP (not localhost for mobile)
  
  5. The mobile app uses the SAME backend APIs:
     - /api/auth/* for authentication
     - /api/tasks/* for task management
     - /api/events/* for calendar
     - /api/notes/* for notes
     - /api/agent/* for AI agent commands
     - /api/dashboard/* for dashboard data
  
  SCREENS TO BUILD:
  - LoginScreen
  - DashboardScreen
  - AgentChatScreen
  - TasksScreen
  - CalendarScreen
  - NotesScreen
  - SettingsScreen
  
  NAVIGATION:
  - Stack Navigator for auth flow
  - Bottom Tab Navigator for main app
  - Each tab has its own stack for detail views
*/

// Mobile API Configuration
const MOBILE_API_CONFIG = {
  // Change this to your backend URL
  // For local development with Android emulator: http://10.0.2.2:5000
  // For local development with iOS simulator: http://localhost:5000
  // For physical device: http://YOUR_IP:5000
  baseURL: 'http://10.0.2.2:5000/api',
  
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      me: '/auth/me'
    },
    tasks: '/tasks',
    events: '/events',
    notes: '/notes',
    agent: {
      execute: '/agent/execute',
      logs: '/agent/logs',
      workflow: '/agent/workflow'
    },
    dashboard: '/dashboard/summary'
  }
};

// Color Theme (matching web app)
const COLORS = {
  bgPrimary: '#0a0e1a',
  bgSecondary: '#111827',
  bgCard: '#1a1f35',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  accentPrimary: '#6366f1',
  accentSecondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6'
};

console.log('AgentFlow Mobile App Configuration:', MOBILE_API_CONFIG);
console.log('Theme Colors:', COLORS);

export { MOBILE_API_CONFIG, COLORS };
