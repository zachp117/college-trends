import type { School } from '../api/scorecard';
import { NetPriceByIncome } from '../components/charts/NetPriceByIncome';
import { CostEarningsScatter } from '../components/charts/CostEarningsScatter';
import { AdmissionHistogram } from '../components/charts/AdmissionHistogram';
import { StateBar } from '../components/charts/StateBar';
import { CompareCard } from '../components/CompareCard';

interface Props {
  schools: School[];
  selectedSchools: School[];
  onClearSelected: () => void;
  onRemoveSelected: (id: number) => void;
}

export function OverviewTab({
  schools,
  selectedSchools,
  onClearSelected,
  onRemoveSelected,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <NetPriceByIncome schools={schools} selected={selectedSchools} />
      <CostEarningsScatter schools={schools} />
      <AdmissionHistogram schools={schools} />
      <StateBar schools={schools} />
      <CompareCard
        schools={selectedSchools}
        onClear={onClearSelected}
        onRemove={onRemoveSelected}
      />
    </div>
  );
}
