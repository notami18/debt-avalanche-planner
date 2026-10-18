import type { Warning } from '@avalancha/engine';
import { resultMessages } from '../i18n/resultMessages.js';
import styles from './TrapNotice.module.css';

interface TrapNoticeProps {
  warnings: readonly Warning[];
  debtNames: ReadonlyMap<string, string>;
}

// SPEC-web §4: una línea por deuda cuya mínima no cubre los intereses.
export function TrapNotice({ warnings, debtNames }: TrapNoticeProps) {
  if (warnings.length === 0) return null;

  return (
    <div className={styles.notice} role="note">
      {warnings.map(({ debtId }) => (
        <p key={debtId} className={styles.line}>
          {resultMessages.minimumBelowInterest(debtNames.get(debtId) ?? debtId)}
        </p>
      ))}
    </div>
  );
}
