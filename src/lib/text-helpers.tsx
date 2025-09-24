import { ReactNode } from "react";

/**
 * URL을 감지하고 하이퍼링크로 변환하는 함수
 * @param text - 변환할 텍스트
 * @returns JSX 요소 배열
 */
export const renderTextWithLinks = (text: string): ReactNode[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};
