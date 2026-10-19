import React, { useState } from "react";
import { Button, Form, Input } from "antd";
import { normalizePhone } from "./model";

interface NewChatFormProps {
  onCreate: (phone: string) => Promise<boolean>;
}

interface FormValues {
  phone: string;
}

export const NewChatForm: React.FC<NewChatFormProps> = ({ onCreate }) => {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      await onCreate(normalizePhone(values.phone));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px]">
      <h2 className="mb-6 text-center text-2xl font-medium text-gray-900">
        Начать новый чат
      </h2>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        disabled={loading}
      >
        <Form.Item
          label="Номер телефона получателя"
          name="phone"
          rules={[
            {
              validator: (_, value?: string) => {
                // Допустимая длина (11 или 12 цифр) указана в описании ошибок CheckAccount
                const digits = normalizePhone(value ?? "");
                return digits.length === 11 || digits.length === 12
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error("Введите номер в международном формате, например +7 999 123 45 67")
                    );
              },
            },
          ]}
        >
          <Input placeholder="+7 999 123 45 67" size="large" />
        </Form.Item>

        <Button
          htmlType="submit"
          block
          size="large"
          className="h-12"
          loading={loading}
        >
          Создать чат
        </Button>
      </Form>
    </div>
  );
};
