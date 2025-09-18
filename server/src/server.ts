import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { generateProjection } from "./projectionService";

const app = express();
const prisma = new PrismaClient();
const PORT = 4000; // 백엔드 서버 포트

// 미들웨어 설정
app.use(cors()); // CORS 허용 (Vite 개발 서버からのリクエストを許可するため)
app.use(express.json()); // JSON 요청 본문을 파싱하기 위함

// 헬퍼 함수: 문자열을 숫자로 바꾸되, 비어있거나 잘못된 값이면 null을 반환
const parseNumber = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

// 데이터 저장 API 라우트
app.post("/api/save-profile", async (req, res) => {
  try {
    const data = req.body;
    console.log("서버가 받은 원본 데이터:", data); // 디버깅용 로그 추가

    // 안전하게 데이터 변환
    const dob = data.dob ? new Date(data.dob) : null;
    if (dob && isNaN(dob.getTime())) {
      // dob가 유효하지 않은 날짜인 경우 null로 처리
      throw new Error("Invalid date of birth provided.");
    }

    const newProfile = await prisma.financialProfile.create({
      data: {
        // Planning Section
        dob: dob,
        retirementAge: parseNumber(data.retirement_age),
        peakWagePeriod: parseNumber(data.peak_wage_period),
        peakWageReductionRate: parseNumber(data.peak_wage_reduction_rate),

        // Expenses Section
        consumptionType:
          data.consumption_type === "percentage" ? "PERCENTAGE" : "AMOUNT",
        monthlyConsumptionValue: parseNumber(
          data.monthly_consumption || data.monthly_consumption_percentage
        ),
        monthlyInsurance: parseNumber(data.monthly_insurance),
        monthlySavings: parseNumber(data.monthly_savings),
        monthlyRepayment: parseNumber(data.monthly_repayment),

        // Income Section
        monthlyIncomes: {
          create: data.monthlyIncomes.map((inc: any) => ({
            month: parseInt(inc.month),
            income: parseNumber(inc.income) ?? 0, // 값이 없으면 0으로 처리
            bonus: parseNumber(inc.bonus) ?? 0, // 값이 없으면 0으로 처리
          })),
        },
        loans: {
          create: (data.loans ?? [])
            .filter((loan: any) => loan.principal && loan.interestRate)
            .map((loan: any) => ({
              principal: parseNumber(loan.principal),
              interestRate: parseNumber(loan.interestRate),
            })),
        },
        realEstateAssets: {
          create: (data.realEstateAssets ?? [])
            .filter((asset: any) => asset.name && asset.currentValue)
            .map((asset: any) => ({
              name: asset.name,
              currentValue: parseNumber(asset.currentValue),
            })),
        },
      },
    });

    res.status(201).json(newProfile);
  } catch (error) {
    console.error("데이터 저장 실패:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  } finally {
    await prisma.$disconnect();
  }
});

// --- [추가] 특정 ID의 프로필 정보를 조회하는 API ---
app.get("/api/profile/:id", async (req, res) => {
  try {
    const { id } = req.params; // URL 경로에서 id를 가져옴

    const profile = await prisma.financialProfile.findUnique({
      where: { id: id },
      // `include`를 사용해 관련된 월별 수입과 대출 정보도 함께 불러옴
      include: {
        monthlyIncomes: {
          orderBy: { month: "asc" }, // 월 순서로 정렬
        },
        loans: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ message: "프로필을 찾을 수 없습니다." });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("데이터 조회 실패:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// --- [추가] 저장된 모든 프로필 목록을 조회하는 API ---
app.get("/api/profiles", async (req, res) => {
  try {
    const profiles = await prisma.financialProfile.findMany({
      // 최신순으로 정렬
      orderBy: {
        createdAt: "desc",
      },
      // 목록에서는 모든 데이터가 필요 없으므로, id와 생성일만 선택
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

app.delete("/api/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.financialProfile.delete({
      where: { id: id },
    });

    // onDelete: Cascade 옵션 덕분에 연결된 수입/대출 정보도 함께 삭제됩니다.
    res.status(200).json({ message: "프로필이 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("프로필 삭제 실패:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// --- [추가] 재무 예측 데이터를 생성하는 API ---
app.get("/api/projection/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const projectionData = await generateProjection(id);
    res.status(200).json(projectionData);
  } catch (error) {
    console.error("재무 예측 생성 실패:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 백엔드 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
