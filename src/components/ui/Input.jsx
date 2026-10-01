import { useState } from 'react';
import { IconEye, IconEyeOff } from '../icons';

export default function Input({ label, error, hint, id, type, ...rest }) {
  const inputId = id || rest.name;
  const isPassword = type === 'password';
  const [show, setShow] = useState(false);

  const actualType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={inputId}>{label}</label>}

      <div className={isPassword ? 'input-with-toggle' : ''}>
        <input
          id={inputId}
          type={actualType}
          className={`input ${error ? 'error' : ''}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className="input-toggle"
            onClick={() => setShow(s => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {show ? <IconEyeOff /> : <IconEye />}
          </button>
        )}
      </div>

      {hint && !error && <div className="field-hint">{hint}</div>}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}