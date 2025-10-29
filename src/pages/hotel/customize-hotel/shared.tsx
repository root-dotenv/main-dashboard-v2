import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";

// --- COMPONENT PROPS ---
interface AccordionItemProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

interface FormFieldProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  options?: { value: string; label: string }[];
}

interface BadgeProps {
  children: React.ReactNode;
  onRemove?: () => void;
}

interface MultiSelectInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

// --- COMPONENT IMPLEMENTATIONS ---

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg mb-4">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-[#0785CF]" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-white rounded-b-lg">{children}</div>
      )}
    </div>
  );
};

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  options,
}) => {
  const commonClasses =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100";
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          className={`resize-none ${commonClasses}`}
        />
      ) : type === "select" ? (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={commonClasses}
        >
          <option value="" disabled>
            {placeholder || "Select an option"}
          </option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) =>
            onChange(
              type === "number"
                ? parseFloat(e.target.value) || ""
                : e.target.value
            )
          }
          placeholder={placeholder}
          disabled={disabled}
          className={commonClasses}
        />
      )}
    </div>
  );
};

export const Badge: React.FC<BadgeProps> = ({ children, onRemove }) => {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D6EEF9] text-blue-800 border-[#B4E6F5]200 border mr-2 mb-2">
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 p-0.5 rounded-full hover:bg-[#B4E6F<｜place▁holder▁no▁797｜>] focus:outline-none"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

export const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
  label,
  value = [],
  onChange,
  options,
  placeholder = "Select items",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter(
    (option) =>
      !value.includes(option.value) &&
      option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleAddItem = (itemValue: string) => {
    if (!value.includes(itemValue)) {
      onChange([...value, itemValue]);
    }
    setInputValue("");
    setIsOpen(false);
  };

  const handleRemoveItem = (itemValue: string) => {
    onChange(value.filter((v) => v !== itemValue));
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="flex flex-wrap items-center border border-gray-300 rounded-md p-1 min-h-[42px]">
          {value.map((itemValue) => {
            const item = options.find((opt) => opt.value === itemValue);
            return (
              <Badge
                key={itemValue}
                onRemove={() => handleRemoveItem(itemValue)}
              >
                {item?.label || itemValue}
              </Badge>
            );
          })}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            className="flex-grow outline-none bg-transparent ml-1 text-sm"
            placeholder={value.length === 0 ? placeholder : ""}
          />
        </div>
        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 border border-gray-300 max-h-60 overflow-auto">
            {filteredOptions.map((option) => (
              <div
                key={option.value}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onMouseDown={() => handleAddItem(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
