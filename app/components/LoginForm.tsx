import React, { useCallback, useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router";
import { login } from "../api/login";
import { useAuthPolling } from "../hooks/useAuthPolling";
import { saveCredentials, type Credentials } from "../storage/credentials";

type FormValues = Credentials;

export const LoginForm: React.FC = () => {
  const [form] = Form.useForm<FormValues>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<FormValues | null>(null);

  const handleAuthorized = useCallback(() => {
    if (credentials) {
      saveCredentials(credentials);
    }
    message.success("Авторизация выполнена");
    navigate("/main");
  }, [credentials, navigate]);

  useAuthPolling(qrCode ? credentials : null, handleAuthorized);

  const onFinish = async (values: FormValues) => {
    setLoading(true);

    const result = await login(values.idInstance, values.apiTokenInstance);

    if (!result.success) {
      message.error(`Ошибка: ${result.error}`);
    } else if (result.data.type === "qrCode") {
      setCredentials(values);
      setQrCode(result.data.message);
    } else if (result.data.type === "alreadyLogged") {
      saveCredentials(values);
      navigate("/main");
    } else {
      message.error(`Ошибка: ${result.data.message}`);
    }

    setLoading(false);
  };

  const handleBack = () => {
    setQrCode(null);
    setCredentials(null);
  };

  if (qrCode) {
    return (
      <div className="mb-6 flex flex-col items-center gap-4">
        <img
          src={`data:image/png;base64,${qrCode}`}
          alt="QR-код для авторизации"
          width={250}
          height={250}
        />
        <Button block size="large" onClick={handleBack}>
          Назад
        </Button>
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} className="mb-6">
      <Form.Item
        label="idInstance"
        name="idInstance"
        rules={[{ required: true, message: "Пожалуйста, введите idInstance" }]}
      >
        <Input placeholder="1234567890" size="large" />
      </Form.Item>

      <Form.Item
        label="apiTokenInstance"
        name="apiTokenInstance"
        rules={[
          { required: true, message: "Пожалуйста, введите apiTokenInstance" },
        ]}
      >
        <Input.Password placeholder="abcd1234..." size="large" />
      </Form.Item>

      <Form.Item className="mb-0">
        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={loading}
          className="h-12"
        >
          Войти
        </Button>
      </Form.Item>
    </Form>
  );
};