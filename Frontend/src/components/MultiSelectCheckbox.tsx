import { Select, Checkbox } from "antd";
import type { DefaultOptionType } from "antd/es/select";

interface Option {
  id: string | number;
  name: string;
}

interface Props {
  options: Option[];
  value: (string | number)[];
  onChange: (value: any[]) => void;
  placeholder?: string;
  loading?: boolean;
  allLabel?: string;
}

interface Props {
  options: Option[];
  value: (string | number)[];
  onChange: (value: any[]) => void;
  placeholder?: string;
  loading?: boolean;
}

export default function MultiSelectCheckbox({
  options = [],
  value = [],
  onChange,
  placeholder = "Select",
  loading = false,
  allLabel = "All",
}: Props) {
  const allOptions: DefaultOptionType[] = [
    {
      value: "__all__",
      label: allLabel,
    },
    ...options.map((item) => ({
      value: String(item.id),
      label: item.name,
    })),
  ];

  const handleChange = (values: any[]) => {
    if (values.includes("__all__")) {
      if (value.length === options.length) {
        onChange([]);
      } else {
        onChange(options.map((x) => String(x.id)));
      }
      return;
    }

    onChange(values);
  };

  return (
    <Select
      mode="multiple"
      allowClear
      showSearch
      className="w-full"
      value={value}
      loading={loading}
      placeholder={placeholder}
      optionFilterProp="label"
      options={allOptions}
      onChange={handleChange}
      maxTagCount="responsive"
      optionRender={(option) => {
        const checked =
          option.data.value === "__all__"
            ? value.length === options.length && options.length > 0
            : value.includes(String(option.data.value));

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Checkbox checked={checked} />
            <span>{option.data.label}</span>
          </div>
        );
      }}
    />
  );
}