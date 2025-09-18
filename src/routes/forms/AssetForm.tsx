import { useFormStore } from "../../stores/form.store";
import type { RealEstateAsset } from "../../types"; // types.ts에서 RealEstateAsset 타입 import

export default function AssetForm() {
  const realEstateAssets = useFormStore((state) => state.realEstateAssets);
  const setProfileData = useFormStore((state) => state.setProfileData);

  const addAsset = () => {
    const newAssets: RealEstateAsset[] = [
      ...realEstateAssets,
      // id를 문자열로 변환하여 타입 일관성 유지
      { id: Date.now().toString(), name: "", currentValue: 0 },
    ];
    setProfileData({ realEstateAssets: newAssets });
  };

  const removeAsset = (id: string) => {
    const newAssets = realEstateAssets.filter((asset) => asset.id !== id);
    setProfileData({ realEstateAssets: newAssets });
  };

  const handleAssetChange = (
    id: string,
    field: "name" | "currentValue",
    value: string
  ) => {
    const newAssets = realEstateAssets.map((asset) => {
      if (asset.id === id) {
        return {
          ...asset,
          [field]: field === "name" ? value : parseFloat(value) || 0,
        };
      }
      return asset;
    });
    setProfileData({ realEstateAssets: newAssets });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text">부동산 자산 정보</h2>
        <button
          type="button"
          onClick={addAsset}
          className="px-4 py-2 text-sm font-semibold bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition"
        >
          자산 추가 +
        </button>
      </div>
      <div className="space-y-4">
        {realEstateAssets.map((asset, index) => (
          <div key={asset.id} className="p-4 bg-background rounded-md border">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-bold">부동산 {index + 1}</h3>
              <button
                type="button"
                onClick={() => removeAsset(asset.id)}
                className="text-sm text-secondary hover:text-danger"
              >
                삭제
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`asset_name_${asset.id}`}
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  자산명
                </label>
                <input
                  id={`asset_name_${asset.id}`}
                  type="text"
                  value={asset.name}
                  onChange={(e) =>
                    handleAssetChange(asset.id, "name", e.target.value)
                  }
                  placeholder="예: 강남 아파트"
                  className="w-full text-sm p-2 rounded-md border"
                />
              </div>
              <div>
                <label
                  htmlFor={`asset_value_${asset.id}`}
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  현재 가치 (만원)
                </label>
                <input
                  id={`asset_value_${asset.id}`}
                  type="number"
                  value={asset.currentValue || ""}
                  onChange={(e) =>
                    handleAssetChange(asset.id, "currentValue", e.target.value)
                  }
                  placeholder="150000"
                  className="w-full text-sm p-2 rounded-md border"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
