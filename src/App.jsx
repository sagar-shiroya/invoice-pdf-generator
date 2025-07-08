import Invoice from './components/Invoice';
import './App.css';
import { ToastProvider } from './hooks/useToast.jsx';

function App() {
  return (
    <ToastProvider>
      <main>
        <Invoice />
      </main>
      <footer className="app-footer">
        <p>&copy; 2025 | Developed by Sagar Shiroya</p>
      </footer>
    </ToastProvider>
  );
}

export default App;
