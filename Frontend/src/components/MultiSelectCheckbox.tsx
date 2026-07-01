import React from "react";
import { Checkbox, Input, Empty } from "antd";
import { SearchOutlined } from "@ant-design/icons";

interface Option {
  id: string;
  name: string;
}

interface Props {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSelectCheckbox({
  options,
  value,
  onChange,
  placeholder = "Search and select...",
  className = "",
}: Props) {
  const [searchText, setSearchText] = React.useState("");

  const filteredOptions = options.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleToggle = (id: string) => {
    if (id === "all") {
      if (value.includes("all")) {
        onChange([]);
      } else {
        onChange(["all"]);
      }
      return;
    }

    // If "All" was selected, clear it
    let newValue = value.filter((v) => v !== "all");

    if (newValue.includes(id)) {
      newValue = newValue.filter((v) => v !== id);
    } else {
      newValue = [...newValue, id];
    }

    onChange(newValue);
  };

  const allSelected = value.includes("all");
  const selectedCount = value.filter((v) => v !== "all").length;

  return (
    <div className={`border border-gray-300 rounded-md ${className}`}>
      {/* Search Input */}
      <div className="p-2 border-b">
        <Input
          prefix={<SearchOutlined />}
          placeholder={placeholder}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      {/* Options List */}
      <div className="max-h-60 overflow-auto p-1">
        {filteredOptions.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No matches" />
        ) : (
          <>
            {/* All Option */}
            {options.length > 0 && (
              <div
                className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer flex items-center gap-2"
                onClick={() => handleToggle("all")}
              >
                <Checkbox checked={allSelected} />
                <span className="font-medium">All</span>
              </div>
            )}

            {/* Individual Options */}
            {filteredOptions.map((item) => (
              <div
                key={item.id}
                className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer flex items-center gap-2"
                onClick={() => handleToggle(item.id)}
              >
                <Checkbox
                  checked={allSelected || value.includes(item.id)}
                />
                <span>{item.name}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      {selectedCount > 0 && (
        <div className="px-3 py-2 border-t text-xs text-gray-500 bg-gray-50 rounded-b-md">
          {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
        </div>
      )}
    </div>
  );
}