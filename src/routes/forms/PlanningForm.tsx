import { useFormStore } from "../../stores/form.store";
import React from "react";

type NumberFields = 'retirementAge' | 'peakWagePeriod' | 'peakWageReductionRate';

export default function PlanningForm() {
  const {
    dob,
    retirementAge,
    peakWagePeriod,
    peakWageReductionRate,
    name,
    familyMembers,
    setProfileData,
  } = useFormStore();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ dob: e.target.value });
  };

  const handleNumberChange = (field: NumberFields, value: string) => {
    setProfileData({ [field]: parseInt(value, 10) || 0 });
};

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ name: e.target.value });
  };

  const handleFamilyMemberChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newFamilyMembers = [...(familyMembers || [])];
    newFamilyMembers[index] = { ...newFamilyMembers[index], [field]: value };
    setProfileData({ familyMembers: newFamilyMembers });
  };
  const addFamilyMember = () => {
    setProfileData({
      familyMembers: [
        ...(familyMembers || []),
        { name: "", age: 0, relationship: "" },
      ],
    });
  };

  return (
    <div>
      {/* 💡 추가된 이름 및 가족 정보 입력 섹션 */}{" "}
      <h2 className="text-2xl font-bold mb-6 text-text">기본 정보</h2>{" "}
      <div className="space-y-4">
        {" "}
        <div>
          {" "}
          <label
            htmlFor="name"
            className="block text-sm font-medium text-secondary mb-1"
          >
            이름
          </label>{" "}
          <input
            id="name"
            type="text"
            value={name || ""}
            onChange={handleNameChange}
            className="w-full text-sm p-2 rounded-md bg-background border"
          />{" "}
        </div>{" "}
      </div>{" "}
      <h3 className="text-xl font-bold mt-8 mb-4 text-text">가족 정보</h3>{" "}
      <div className="space-y-4">
        {" "}
        {familyMembers?.map((member, index) => (
          <div key={index} className="flex space-x-2">
            {" "}
            <input
              type="text"
              placeholder="이름"
              value={member.name}
              onChange={(e) =>
                handleFamilyMemberChange(index, "name", e.target.value)
              }
              className="w-1/3 text-sm p-2 rounded-md bg-background border"
            />{" "}
            <input
              type="number"
              placeholder="나이"
              value={member.age}
              onChange={(e) =>
                handleFamilyMemberChange(index, "age", parseInt(e.target.value))
              }
              className="w-1/3 text-sm p-2 rounded-md bg-background border"
            />{" "}
            <input
              type="text"
              placeholder="관계"
              value={member.relationship}
              onChange={(e) =>
                handleFamilyMemberChange(index, "relationship", e.target.value)
              }
              className="w-1/3 text-sm p-2 rounded-md bg-background border"
            />{" "}
          </div>
        ))}{" "}
      </div>{" "}
      <button
        onClick={addFamilyMember}
        className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
      >
        가족 추가{" "}
      </button>{" "}
      <h2 className="text-2xl font-bold mb-6 text-text mt-8">미래 계획</h2>{" "}
      <div className="space-y-4">
        {" "}
        <div>
          {" "}
          <label
            htmlFor="dob"
            className="block text-sm font-medium text-secondary mb-1"
          >
            생년월일
          </label>{" "}
          <input
            id="dob"
            type="date"
            value={dob}
            onChange={handleDateChange}
            className="w-full text-sm p-2 rounded-md bg-background border"
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <label
            htmlFor="retirement_age"
            className="block text-sm font-medium text-secondary mb-1"
          >
            정년 (만 나이)
          </label>{" "}
          <input
            id="retirement_age"
            type="number"
            value={retirementAge || ""}
            onChange={(e) =>
              handleNumberChange("retirementAge", e.target.value)
            }
            className="w-full text-sm p-2 rounded-md bg-background border"
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <label
            htmlFor="peak_wage_period"
            className="block text-sm font-medium text-secondary mb-1"
          >
            임금피크 기간 (년)
          </label>{" "}
          <input
            id="peak_wage_period"
            type="number"
            value={peakWagePeriod || ""}
            onChange={(e) =>
              handleNumberChange("peakWagePeriod", e.target.value)
            }
            className="w-full text-sm p-2 rounded-md bg-background border"
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <label
            htmlFor="peak_wage_reduction_rate"
            className="block text-sm font-medium text-secondary mb-1"
          >
            임금피크 감소율 (%)
          </label>{" "}
          <input
            id="peak_wage_reduction_rate"
            type="number"
            value={peakWageReductionRate || ""}
            onChange={(e) =>
              handleNumberChange("peakWageReductionRate", e.target.value)
            }
            className="w-full text-sm p-2 rounded-md bg-background border"
          />{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
