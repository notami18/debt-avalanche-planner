import styles from './TextField.module.css';

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  inputMode?: 'text' | 'numeric' | 'decimal' | undefined;
  placeholder?: string | undefined;
  /** Ayuda entre la etiqueta y el campo: la pregunta que el campo responde. */
  help?: string | undefined;
  /** Ayuda debajo del campo, p. ej. la equivalencia en vivo de la tasa. */
  hint?: string | undefined;
  error?: string | undefined;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  inputMode = 'text',
  placeholder,
  help,
  hint,
  error,
}: TextFieldProps) {
  const helpId = `${id}-help`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [help ? helpId : null, hint ? hintId : null, error ? errorId : null]
    .filter((part) => part !== null)
    .join(' ');

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {help && (
        <p id={helpId} className={styles.hint}>
          {help}
        </p>
      )}
      <input
        id={id}
        className={styles.input}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
