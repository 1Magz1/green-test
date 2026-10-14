import { Button } from "antd";
import { Link } from "react-router";

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Login Page</h1>
      <p className="mb-4">Placeholder for login functionality.</p>
      <Link to="/main">
        <Button type="primary">Go to Main Page</Button>
      </Link>
    </div>
  );
}
