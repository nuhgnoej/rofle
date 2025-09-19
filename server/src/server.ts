// server/src/server.ts
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { generateProjection } from "./projectionService";

const app = express();
const prisma = new PrismaClient();
const PORT = 4000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 헬퍼 함수: 문자열을 숫자로 바꾸되, 비어있거나 잘못된 값이면 null을 반환
const parseNumber = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

// 프로필 데이터 저장 (부동산 데이터 포함)
app.post("/api/save-profile", async (req, res) => {
  try {
    const { monthlyIncomes, loans, realEstateAssets, ...profileData } =
      req.body;

    const newProfile = await prisma.financialProfile.create({
      data: {
        dob: profileData.dob ? new Date(profileData.dob) : null,
        retirementAge: parseNumber(profileData.retirementAge),
        peakWagePeriod: parseNumber(profileData.peakWagePeriod),
        peakWageReductionRate: parseNumber(profileData.peakWageReductionRate),
        salaryInflationRate: parseNumber(profileData.salaryInflationRate),
        consumptionType: profileData.consumptionType,
        monthlyConsumptionValue: parseNumber(
          profileData.monthlyConsumptionValue
        ),
        monthlyRepayment: parseNumber(profileData.monthlyRepayment),
        monthlyInsurance: parseNumber(profileData.monthlyInsurance),
        monthlySavings: parseNumber(profileData.monthlySavings),
      },
    });

    // 월별 수입 데이터 저장
    if (monthlyIncomes && Array.isArray(monthlyIncomes)) {
      await prisma.monthlyIncome.createMany({
        data: monthlyIncomes.map((income) => ({
          month: income.month,
          income: parseFloat(income.income),
          bonus: parseFloat(income.bonus),
          profileId: newProfile.id,
        })),
      });
    }

    // 대출 데이터 저장
    if (loans && Array.isArray(loans)) {
      await prisma.loan.createMany({
        data: loans.map((loan) => ({
          name: loan.name,
          type: loan.type,
          principal: parseFloat(loan.principal),
          interestRate: parseFloat(loan.interestRate),
          termInYears: parseFloat(loan.termInYears),
          profileId: newProfile.id,
        })),
      });
    }

    if (realEstateAssets && Array.isArray(realEstateAssets)) {
      await prisma.realEstateAsset.createMany({
        data: realEstateAssets.map((asset) => ({
          name: asset.name,
          currentValue: parseFloat(asset.currentValue),
          profileId: newProfile.id,
        })),
      });
    }

    // 💡 추가된 부분: 예측 로직 호출 및 결과 저장
    const { projection } = await generateProjection(newProfile.id);

    await prisma.projectedData.createMany({
      data: projection.map((monthData) => ({
        ...monthData,
        profileId: newProfile.id,
      })),
    });

    res.status(201).json(newProfile);
  } catch (error) {
    console.error("데이터 저장 실패:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// ✅ 새로운 API: 재무 예측 결과를 계산하고 데이터베이스에 저장
app.post("/api/save-projection/:profileId", async (req, res) => {
  try {
    const { profileId } = req.params; // 1. 재무 예측 계산 실행

    const { projection, summary } = await generateProjection(profileId); // 2. 기존 예측 데이터 삭제

    await prisma.projectedData.deleteMany({
      where: { profileId: profileId },
    }); // 3. 새로운 예측 데이터를 데이터베이스에 저장

    const savedData = await prisma.projectedData.createMany({
      data: projection.map((monthData) => ({
        ...monthData,
        profileId: profileId,
      })),
    });

    res.status(201).json({
      message: "재무 예측 결과가 성공적으로 저장되었습니다.",
      count: savedData.count,
      summary, // 최종 요약 데이터도 함께 반환
    });
  } catch (error) {
    console.error("예측 결과 저장 실패:", error);
    res.status(500).json({ message: "예측 결과 저장 중 오류가 발생했습니다." });
  }
});

// 단일 프로필 조회 (모든 관련 데이터 포함)
app.get("/api/profile/:id", async (req, res) => {
  const { id } = req.params;
  const profile = await prisma.financialProfile.findUnique({
    where: { id: id },
    include: {
      monthlyIncomes: true,
      loans: true,
      realEstateAssets: true,
      projectedData: {
        orderBy: [{ year: "asc" }, { month: "asc" }],
      },
    },
  });
  if (!profile || !profile.dob || !profile.retirementAge) {
    // 필수 데이터가 없으면 오류를 반환하거나 다른 로직을 처리합니다.
    return res.status(404).json({ message: "프로필 정보가 불충분합니다." });
  }

  const finalState = profile.projectedData[profile.projectedData.length - 1];
  const finalSummary = {
    retirementYear: new Date(profile.dob).getFullYear() + profile.retirementAge,
    finalSavings: finalState?.cumulativeSavings || 0,
    finalRealEstateValue: finalState?.realEstateValue || 0,
    finalAssets:
      (finalState?.cumulativeSavings || 0) + (finalState?.realEstateValue || 0),
    finalLiabilities: finalState?.remainingLoanPrincipal || 0,
    totalInterestPaid: profile.projectedData.reduce(
      (sum, p) => sum + (p.loanInterestPaid || 0),
      0
    ),
  }; // 💡 수정된 부분: 응답에 profile과 summary를 함께 포함

  res.status(200).json({ ...profile, summary: finalSummary });
});

// 모든 프로필 목록 조회
app.get("/api/profiles", async (req, res) => {
  try {
    const profiles = await prisma.financialProfile.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
      },
    });
    res.status(200).json(profiles);
  } catch (error) {
    console.error("프로필 목록 조회 실패:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 월별 데이터 업데이트 (오버라이드)
app.put("/api/projected-data/:monthId", async (req, res) => {
  try {
    const { monthId } = req.params;
    const { income, monthlyConsumption } = req.body;

    const incomeValue = parseNumber(income);
    const consumptionValue = parseNumber(monthlyConsumption);

    const updatedData = await prisma.projectedData.update({
      where: { id: monthId },
      data: {
        income: incomeValue === null ? undefined : incomeValue,
        monthlyConsumption:
          consumptionValue === null ? undefined : consumptionValue,
        isOverridden: true,
      },
    });
    res.status(200).json(updatedData);
  } catch (error) {
    console.error("데이터 업데이트 실패:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 프로필 삭제
app.delete("/api/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.financialProfile.delete({
      where: { id: id },
    });

    res.status(200).json({ message: "프로필이 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("프로필 삭제 실패:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 백엔드 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
