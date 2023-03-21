import logo from "./logo.svg";
import "./App.css";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from "react-router-dom";
import {
  ChieftainAuthProvider,
  LoginBox,
  useChieftainAuth,
} from "@shiryam/chieftain/react";
import { useEffect, useRef } from "react";

function App() {
  return (
    <>
      <ChieftainAuthProvider
        baseURL="https://auth-api.pitcrewhr.com"
        redirectUri="/dashboard"
      >
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/test" element={<h1>Test</h1>} />
            <Route path="/googleAuth/oauth/callback" element={<Callback />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ChieftainAuthProvider>
    </>
  );
}

function Callback() {
  const { authCallback } = useChieftainAuth();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
    } else {
      authCallback(window.location.search);
    }
  }, [authCallback]);

  return (
    <div>
      Exchange of oauth code for auth_token will take place in this component
    </div>
  );
}

export default App;

function ProtectedRoute({ children }) {
  const { user } = useChieftainAuth();
  const { isAuthenticated } = user;
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return <>{isAuthenticated && children}</>;
}

function Home() {
  return (
    <>
      <div className="form-wrapper">
        <LoginBox />
      </div>
    </>
  );
}

function Dashboard() {
  const { logout } = useChieftainAuth();

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button onClick={() => logout()}>Logout</button>
      </header>
    </div>
  );
}
