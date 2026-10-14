import { Button } from "antd";
import { Link } from "react-router";

export default function Main() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Main Page</h1>
      <p className="mb-4">Placeholder for main application content.</p>
      <Link to="/">
        <Button type="primary" block>Go to Login Page</Button>
      </Link>
    </div>
  );
}
