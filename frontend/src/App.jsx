import { useEffect } from "react";
import API from "./services/api";

function App() {
  useEffect(() => {
    API.get("/api/test").then(res => console.log(res.data));
  }, []);

  return <h1>Inventory System</h1>;
}

export default App;
