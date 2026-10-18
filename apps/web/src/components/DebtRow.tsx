import type { ValidationCode } from '@avalancha/engine';
import { formatPercent } from '../format/percent.js';
import { validationMessages } from '../i18n/validationMessages.js';
import { debtFieldKey, defaultDebtName, fieldId } from '../plan/fields.js';
import { rateEquivalence } from '../plan/rateEquivalence.js';
import type { DebtForm, DebtTextField, FieldKey, RateType } from '../plan/types.js';
import buttons from '../styles/buttons.module.css';
import styles from './DebtRow.module.css';
import { TextField } from './TextField.js';

interface DebtRowProps {
  debt: DebtForm;
  index: number;
  errorFor: (key: FieldKey) => ValidationCode | undefined;
  onChange: (field: DebtTextField, value: string) => void;
  onRateTypeChange: (rateType: RateType) => void;
  onBlur: (key: FieldKey) => void;
  onRemove: () => void;
}

const RATE_TYPES: readonly { value: RateType; label: string }[] = [
  { value: 'EA', label: 'E.A.' },
  { value: 'MV', label: 'M.V.' },
];

function equivalenceText(debt: DebtForm): string | undefined {
  const equivalence = rateEquivalence(debt.rate, debt.rateType);
  if (equivalence === null) return undefined;

  const annual = formatPercent(equivalence.annualEffectiveRate);
  const monthly = formatPercent(equivalence.monthlyRate);
  return debt.rateType === 'EA'
    ? `${annual} E.A. equivale a ${monthly} mes vencido`
    : `${monthly} M.V. equivale a ${annual} E.A.`;
}

export function DebtRow({
  debt,
  index,
  errorFor,
  onChange,
  onRateTypeChange,
  onBlur,
  onRemove,
}: DebtRowProps) {
  const title = debt.name.trim() || defaultDebtName(index);
  const rateTypeHelpId = `${fieldId(debtFieldKey(debt.id, 'rate'))}-type-help`;

  const field = (
    name: DebtTextField,
    label: string,
    options: {
      inputMode?: 'numeric' | 'decimal';
      placeholder?: string;
      hint?: string | undefined;
    } = {},
  ) => {
    const key = debtFieldKey(debt.id, name);
    const code = errorFor(key);
    return (
      <TextField
        id={fieldId(key)}
        label={label}
        value={debt[name]}
        onChange={(value) => onChange(name, value)}
        onBlur={() => onBlur(key)}
        inputMode={options.inputMode}
        placeholder={options.placeholder}
        hint={options.hint}
        error={code && validationMessages[code]}
      />
    );
  };

  return (
    <fieldset className={styles.row}>
      <legend className={styles.legend}>{title}</legend>
      <div className={styles.fields}>
        <div className={styles.wide}>
          {field('name', 'Nombre', { placeholder: defaultDebtName(index) })}
        </div>
        {field('balance', 'Saldo', { inputMode: 'numeric', placeholder: '4.500.000' })}
        {field('minimumPayment', 'Cuota mínima', { inputMode: 'numeric', placeholder: '225.000' })}
        {field('rate', 'Tasa (%)', {
          inputMode: 'decimal',
          placeholder: '28,5',
          hint: equivalenceText(debt),
        })}
        <fieldset className={styles.rateType} aria-describedby={rateTypeHelpId}>
          <legend className={styles.rateTypeLegend}>Tipo de tasa</legend>
          <div className={styles.options}>
            {RATE_TYPES.map((option) => (
              <label key={option.value} className={styles.option}>
                <input
                  type="radio"
                  name={`${debt.id}-rateType`}
                  value={option.value}
                  checked={debt.rateType === option.value}
                  onChange={() => onRateTypeChange(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
          <p id={rateTypeHelpId} className={styles.help}>
            Tu extracto suele traer las dos. La E.A. es la que realmente crece tu deuda en un
            año.
          </p>
        </fieldset>
      </div>
      <button
        type="button"
        className={buttons.quiet}
        onClick={onRemove}
        aria-label={`Quitar ${title}`}
      >
        Quitar
      </button>
    </fieldset>
  );
}
