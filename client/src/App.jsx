import { Routes, Route } from "react-router-dom";
import Register from "./pages/signUp";
import Login from "./pages/SignIn";
import Home from "./pages/home";


function App() {


  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signUp" element={<Register />} />
      <Route path="/signIn" element={<Login />} />
    </Routes>
  );
}

export default App;
