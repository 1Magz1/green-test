import { Card } from "antd";
import { Link } from "react-router";
import { LoginForm } from "../components/LoginForm";

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Card
        className="w-full max-w-md shadow-lg"
        style={{ borderRadius: '16px' }}
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-3xl">M</span>
          </div>
          <h1 className="text-xl font-bold">Вход в чат МАКС</h1>
        </div>

        <LoginForm />
      </Card>
    </div>
  );
}
