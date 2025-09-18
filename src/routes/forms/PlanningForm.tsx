import { useFormStore } from '../../stores/form.store';

export default function PlanningForm() {
    const { dob, retirementAge, peakWagePeriod, peakWageReductionRate, setProfileData } = useFormStore();

    // 값을 변경하는 핸들러 함수들
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ dob: e.target.value });
    };

    const handleNumberChange = (field: keyof typeof initialState, value: string) => {
        setProfileData({ [field]: parseInt(value, 10) || 0 });
    };
 
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-text">미래 계획</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="dob" className="block text-sm font-medium text-secondary mb-1">생년월일</label>
                    <input 
                        id="dob" 
                        type="date" 
                        value={dob}                        
                        onChange={handleDateChange}
                        className="w-full text-sm p-2 rounded-md bg-background border" 
                    />
                </div>
                <div>
                    <label htmlFor="retirement_age" className="block text-sm font-medium text-secondary mb-1">정년 (만 나이)</label>
                    <input 
                        id="retirement_age" 
                        type="number"
                        value={retirementAge || ''}
                        onChange={(e) => handleNumberChange('retirementAge', e.target.value)}
                        className="w-full text-sm p-2 rounded-md bg-background border"
                    />
                </div>
                <div>
                    <label htmlFor="peak_wage_period" className="block text-sm font-medium text-secondary mb-1">임금피크 기간 (년)</label>
                    <input 
                        id="peak_wage_period" 
                        type="number"
                        value={peakWagePeriod || ''}
                        onChange={(e) => handleNumberChange('peakWagePeriod', e.target.value)}
                        className="w-full text-sm p-2 rounded-md bg-background border"
                    />
                </div>
                <div>
                    <label htmlFor="peak_wage_reduction_rate" className="block text-sm font-medium text-secondary mb-1">임금피크 감소율 (%)</label>
                    <input 
                        id="peak_wage_reduction_rate" 
                        type="number"
                        value={peakWageReductionRate || ''}
                        onChange={(e) => handleNumberChange('peakWageReductionRate', e.target.value)}
                        className="w-full text-sm p-2 rounded-md bg-background border"
                    />
                </div>
            </div>
        </div>
    );
}

// 임시 initialState 타입 추론용 (실제 값은 store에 있음)
const initialState = {
    retirementAge: 0,
    peakWagePeriod: 0,
    peakWageReductionRate: 0,
}