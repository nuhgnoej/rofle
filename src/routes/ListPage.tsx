import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProfileCard from "../components/ProfileCard";

interface ProfileSummary {
  id: string;
  createdAt: string;
}

export default function ListPage() {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/profiles`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error("데이터 목록을 불러오는데 실패했습니다.");
        }
        const data = await response.json();
        setProfiles(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  // --- [추가] 프로필 삭제를 처리하는 함수 ---
  const handleDeleteProfile = async (idToDelete: string) => {
    // 사용자에게 다시 한번 확인
    if (!window.confirm("정말로 이 프로필을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const apiUrl = `${
        import.meta.env.VITE_API_BASE_URL
      }/api/profile/${idToDelete}`;
      const response = await fetch(apiUrl, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("삭제에 실패했습니다.");
      }

      setProfiles((currentProfiles) =>
        currentProfiles.filter((profile) => profile.id !== idToDelete)
      );
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading)
    return <div className="text-center p-10">목록을 불러오는 중입니다...</div>;
  if (error)
    return <div className="text-center p-10 text-red-500">오류: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-text">저장된 프로필 목록</h1>
        <Link
          to="/new"
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          + 새 프로필 작성
        </Link>
      </div>

      {profiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              id={profile.id}
              createdAt={profile.createdAt}
              onDelete={handleDeleteProfile}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600">저장된 프로필이 없습니다.</p>
          <p className="text-gray-500 mt-2">
            새 프로필을 작성해서 미래를 계획해보세요!
          </p>
        </div>
      )}
    </div>
  );
}
