import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppRoutes } from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <FirebaseProvider>
          <AuthProvider>
            <NotificationProvider>
              <div className="app">
                <AppRoutes />
              </div>
            </NotificationProvider>
          </AuthProvider>
        </FirebaseProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;