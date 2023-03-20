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
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertIcon,
  Button,
  CloseButton,
  Divider,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
} from "@chakra-ui/react";

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
  }, []);

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

function Login() {
  const { getOAuthClients, handleOAuth } = useChieftainAuth();

  const [providers, setProviders] = useState([]);

  useEffect(() => {
    (async function () {
      const resp = await getOAuthClients();
      setProviders(resp.data.social_providers);
    })();
  }, [getOAuthClients]);

  return (
    <div className="form-test">
      <SignInWithOtp />
      <Flex align={"center"}>
        <Divider margin={"2.5rem 0"} />
        <Text padding="2">OR</Text>
        <Divider margin={"2.5rem 0"} />
      </Flex>

      {providers?.map((provider, i) => (
        <Button
          key={i}
          size="lg"
          leftIcon={
            <img
              src={`data:image/svg+xml;base64,${provider?.icon}`}
              alt="social-icon"
              style={{ height: "1.5rem" }}
            />
          }
          variant="outline"
          onClick={() =>
            handleOAuth(
              provider.name,
              "candidate",
              "http://localhost:3000/googleAuth/oauth/callback"
            )
          }
        >{`Sign in with ${provider.display_name}`}</Button>
      ))}
    </div>
  );
}

function SignInWithOtp() {
  const navigate = useNavigate();
  const { sendOTP, submitOtp, authSuccess } = useChieftainAuth();
  const [otpState, setOtpState] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ msg: "", status: "success" });
  const [form, setForm] = useState({
    email: "",
    otp: "",
    challenge_id: "",
  });

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm({
      ...form,
      [name]: value,
    });
    //if email is updated after sending OTP reset otp state
    name === "email" && otpState === 2 && setOtpState(1);
  };

  const handleClick = async () => {
    setLoading(true);
    if (otpState === 1) {
      try {
        const resp = await sendOTP(form.email, ["candidate"]);
        setForm({
          ...form,
          challenge_id: resp.data.challenge_id,
        });
        setOtpState(2);
        setLoading(false);
        setAlert({ msg: "OTP sent !", status: "success" });
      } catch (err) {
        setAlert({
          msg: err?.response?.data?.detail[0]?.msg ?? "Something went wrong",
          status: "error",
        });
        setLoading(false);
      }
    } else {
      const { email, otp, challenge_id } = form;
      const answer = { otp: Number(otp) };

      const resp = await submitOtp(email, challenge_id, answer);
      const { tokens, user } = resp.data;
      if (tokens) {
        authSuccess(tokens, user ?? "");
        navigate("/dashboard");
      } else {
        console.log("Something went wrong", resp);
      }
      setLoading(false);
    }
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    handleClick();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={4} marginBottom={"1rem"}>
        <Input
          name="email"
          size={"lg"}
          type="email"
          placeholder="Email Id"
          onChange={handleChange}
        />
        <Input
          name="otp"
          disabled={otpState === 1}
          size="lg"
          maxLength={6}
          placeholder="OTP"
          onChange={handleChange}
        />
        <Button
          type="submit"
          isLoading={loading}
          py={"22px"}
          color="#fff"
          backgroundColor="#2b2e4a"
          variant="outline"
          _hover={{
            background: "#e91e63",
          }}
        >
          {otpState === 1 ? "Sign In" : "Verify"}
        </Button>
      </Stack>
      {alert.msg !== "" && (
        <Alert status={alert.status}>
          <Flex width={"100%"}>
            <AlertIcon />
            {alert.msg}
          </Flex>
          <CloseButton
            alignSelf="flex-start"
            position="relative"
            right={-1}
            top={-1}
            onClick={() => setAlert((p) => ({ ...p, msg: "" }))}
          />
        </Alert>
      )}
    </form>
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
