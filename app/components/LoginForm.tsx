import React, { useState } from "react";
import { Form, Input, Button } from "antd";

interface LoginFormProps {
  onSuccess?: (values: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    console.log("Mock request with values:", values);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (onSuccess) {
        onSuccess(values);
      } else {
        alert("Error");
      }
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      className="mb-6"
    >
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
        rules={[{ required: true, message: "Пожалуйста, введите apiTokenInstance" }]}
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
