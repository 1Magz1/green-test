import React from "react";
import { Button, Form, Input } from "antd";
import { normalizePhone } from "./model";

interface NewChatFormProps {
  onCreate: (phone: string) => void;
}

interface FormValues {
  phone: string;
}

export const NewChatForm: React.FC<NewChatFormProps> = ({ onCreate }) => {
  const [form] = Form.useForm<FormValues>();

  const handleFinish = (values: FormValues) => {
    onCreate(normalizePhone(values.phone));
    form.resetFields();
  };

  return (
    <div className="w-full max-w-[420px]">
      <h2 className="mb-6 text-center text-2xl font-medium text-gray-900">
        Начать новый чат
      </h2>

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Номер телефона получателя"
          name="phone"
          rules={[
            {
              validator: (_, value?: string) => {
                const digits = normalizePhone(value ?? "");
                return digits.length >= 10 && digits.length <= 15
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error("Введите номер, например +7 999 123 45 67")
                    );
              },
            },
          ]}
        >
          <Input placeholder="+7 999 123 45 67" size="large" />
        </Form.Item>

        <Button htmlType="submit" block size="large" className="h-12">
          Создать чат
        </Button>
      </Form>
    </div>
  );
};
