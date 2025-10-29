// src/components/custom/expandable-text.tsx

import React, { useState } from "react";

// The shorten utility logic is now part of this component's logic
const shorten = (text: string, wordLimit: number): string => {
  if (!text || typeof text !== "string") return "";
  const words = text.split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(" ") + "...";
};

interface ExpandableTextProps {
  text: string;
  wordLimit?: number;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  wordLimit = 70,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine if the text is long enough to need truncation
  const isTruncatable = (text?.split(/\s+/).length || 0) > wordLimit;

  // Toggle the expanded state
  const toggleIsExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <p className="text-[#334155] text-[0.9375rem] leading-relaxed">
        {isExpanded ? text : shorten(text, wordLimit)}
      </p>

      {/* Only show the button if the text is long enough to be truncated */}
      {isTruncatable && (
        <button
          onClick={toggleIsExpanded}
          className="text-[#0785CF] font-semibold text-sm mt-2 hover:underline focus:outline-none"
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};
