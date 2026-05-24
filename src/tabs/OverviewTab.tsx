import type { School } from '../api/scorecard';
import { NetPriceByIncome } from '../components/charts/NetPriceByIncome';
import { CostEarningsScatter } from '../components/charts/CostEarningsScatter';
import { AdmissionHistogram } from '../components/charts/AdmissionHistogram';
import { StateBar } from '../components/charts/StateBar';
import { CompareCard } from '../components/CompareCard';
import { Accordion, AccordionSection } from '../components/Accordion';

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
    <Accordion>
      <AccordionSection id="overview.netPrice" title="Net price by family income">
        <NetPriceByIncome schools={schools} selected={selectedSchools} />
      </AccordionSection>
      <AccordionSection id="overview.costEarnings" title="Cost vs. earnings">
        <CostEarningsScatter schools={schools} />
      </AccordionSection>
      <AccordionSection id="overview.admissionRate" title="Admission rate distribution">
        <AdmissionHistogram schools={schools} />
      </AccordionSection>
      <AccordionSection id="overview.byState" title="Schools by state">
        <StateBar schools={schools} />
      </AccordionSection>
      {selectedSchools.length > 0 && (
        <AccordionSection id="overview.compareCard" title="Pinned schools">
          <CompareCard
            schools={selectedSchools}
            onClear={onClearSelected}
            onRemove={onRemoveSelected}
          />
        </AccordionSection>
      )}
    </Accordion>
  );
}
