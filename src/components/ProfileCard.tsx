import React from "react";
import { Link } from "react-router-dom";

interface ProfileCardProps {
  id: string;
  createdAt: string;
  onDelete: (id: string) => void;
}

// 휴지통 SVG 아이콘: fill 속성을 "currentColor"로 변경
const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
      clipRule="evenodd"
    />
  </svg>
);

export default function ProfileCard({
  id,
  createdAt,
  onDelete,
}: ProfileCardProps) {
  const formattedDate = new Date(createdAt).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(id);
  };

  return (
    // [스타일 수정] border 제거, 그림자 효과 강화
    <Link
      to={`/result/${id}`}
      className="relative block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      {/* [스타일 수정] 기본 색상 및 hover 시 빨간색으로 변경 */}
      <button
        onClick={handleDelete}
        className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 rounded-full transition-colors"
        aria-label="삭제"
      >
        <TrashIcon />
      </button>

      <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">
        재무 분석 프로필
      </h5>
      <p className="font-normal text-gray-600">생성일: {formattedDate}</p>
    </Link>
  );
}
