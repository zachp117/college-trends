import type { School } from '../api/scorecard';
import { DebtDistribution } from '../components/charts/DebtDistribution';
import { DebtByGroup } from '../components/charts/DebtByGroup';
import { RepaymentCurve } from '../components/charts/RepaymentCurve';
import { DebtVsEarnings } from '../components/charts/DebtVsEarnings';
import { DebtSummaryStats } from '../components/charts/DebtSummaryStats';
import { DefaultRateBar } from '../components/charts/DefaultRateBar';

interface Props {
  schools: School[];
  selectedSchools: School[];
}

export function DebtRepaymentTab({ schools, selectedSchools }: Props) {
  return (
    <div className="space-y-6">
      <DebtSummaryStats schools={schools} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DebtDistribution schools={schools} />
        <DefaultRateBar schools={schools} selected={selectedSchools} />
        <DebtByGroup schools={schools} selected={selectedSchools} />
        <RepaymentCurve schools={schools} selected={selectedSchools} />
        <div className="lg:col-span-2">
          <DebtVsEarnings schools={schools} />
        </div>
      </div>
    </div>
  );
}
