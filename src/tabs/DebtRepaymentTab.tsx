import type { School } from '../api/scorecard';
import { DebtDistribution } from '../components/charts/DebtDistribution';
import { DebtByGroup } from '../components/charts/DebtByGroup';
import { RepaymentCurve } from '../components/charts/RepaymentCurve';
import { DebtVsEarnings } from '../components/charts/DebtVsEarnings';
import { DebtSummaryStats } from '../components/charts/DebtSummaryStats';
import { DefaultRateBar } from '../components/charts/DefaultRateBar';
import { Accordion, AccordionSection } from '../components/Accordion';

interface Props {
  schools: School[];
  selectedSchools: School[];
}

export function DebtRepaymentTab({ schools, selectedSchools }: Props) {
  return (
    <Accordion>
      <AccordionSection id="debt.summary" title="Debt summary">
        <DebtSummaryStats schools={schools} />
      </AccordionSection>
      <AccordionSection id="debt.distribution" title="Median debt distribution">
        <DebtDistribution schools={schools} />
      </AccordionSection>
      <AccordionSection id="debt.defaultRate" title="3-year default rate">
        <DefaultRateBar schools={schools} selected={selectedSchools} />
      </AccordionSection>
      <AccordionSection id="debt.byGroup" title="Median debt by student group">
        <DebtByGroup schools={schools} selected={selectedSchools} />
      </AccordionSection>
      <AccordionSection id="debt.repaymentCurve" title="Repayment progress">
        <RepaymentCurve schools={schools} selected={selectedSchools} />
      </AccordionSection>
      <AccordionSection id="debt.vsEarnings" title="Debt vs. earnings (10 yrs out)">
        <DebtVsEarnings schools={schools} />
      </AccordionSection>
    </Accordion>
  );
}
