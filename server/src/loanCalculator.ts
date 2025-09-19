// server/src/loanCalculator.ts
import type { Loan } from "../../src/types";

/**
 * 월별 이자액을 계산합니다.
 */
export const calculateMonthlyInterest = (
  principal: number,
  interestRate: number
): number => {
  if (interestRate === 0) return 0;
  return (principal * (interestRate / 100)) / 12;
};

/**
 * 원리금균등 상환 방식의 월 상환액을 계산합니다.
 */
export const calculateEqualPayment = (
  principal: number,
  interestRate: number,
  termInMonths: number
): number => {
  if (interestRate === 0 || termInMonths <= 0) return principal / termInMonths;
  const monthlyInterestRate = interestRate / 100 / 12;
  const numerator = principal * monthlyInterestRate;
  const denominator = 1 - Math.pow(1 + monthlyInterestRate, -termInMonths);
  return numerator / denominator;
};

/**
 * 원금균등 상환 방식의 해당 월 원금 상환액을 계산합니다.
 */
export const calculateEqualPrincipal = (
  originalPrincipal: number,
  termInMonths: number
): number => {
  if (termInMonths <= 0) return originalPrincipal;
  return originalPrincipal / termInMonths;
};

/**
 * 만기일시 상환 방식의 해당 월 원금 상환액을 계산합니다.
 */
export const calculateBulletPrincipal = (
  originalPrincipal: number,
  currentMonth: number,
  termInMonths: number
): number => {
  if (currentMonth === termInMonths) {
    return originalPrincipal;
  }
  return 0;
};