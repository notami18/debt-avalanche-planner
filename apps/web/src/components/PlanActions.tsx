import { useEffect, useRef, useState } from 'react';
import buttons from '../styles/buttons.module.css';
import styles from './PlanActions.module.css';

interface PlanActionsProps {
  /** Sin datos no hay nada que borrar: el botón no aparece (SPEC-web §3). */
  hasData: boolean;
  onLoadExample: () => void;
  onClear: () => void;
}

export function PlanActions({ hasData, onLoadExample, onClear }: PlanActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const exampleRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const clearRef = useRef<HTMLButtonElement>(null);
  const hasToggled = useRef(false);

  // El botón que tenía el foco desaparece: el foco pasa al que lo reemplaza. Después de
  // borrar ya no hay "Borrar mis datos", así que pasa a "Cargar ejemplo".
  useEffect(() => {
    if (!hasToggled.current) return;
    (confirming ? cancelRef.current : (clearRef.current ?? exampleRef.current))?.focus();
  }, [confirming]);

  const toggle = (next: boolean) => {
    hasToggled.current = true;
    setConfirming(next);
  };

  return (
    <div className={styles.actions}>
      <button ref={exampleRef} type="button" className={buttons.button} onClick={onLoadExample}>
        Cargar ejemplo
      </button>
      {hasData &&
        (confirming ? (
          <div className={styles.confirm} role="group" aria-labelledby="clear-question">
            <span id="clear-question">¿Borrar todo?</span>
            <button
              type="button"
              className={buttons.button}
              onClick={() => {
                onClear();
                toggle(false);
              }}
            >
              Sí, borrar
            </button>
            <button
              ref={cancelRef}
              type="button"
              className={buttons.quiet}
              onClick={() => toggle(false)}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            ref={clearRef}
            type="button"
            className={buttons.quiet}
            onClick={() => toggle(true)}
          >
            Borrar mis datos
          </button>
        ))}
    </div>
  );
}
