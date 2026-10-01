import { IconCheck } from '../icons';

export default function Checkbox({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={checked}
      className={`checkbox ${checked ? 'checked' : ''}`}
      onClick={onChange}
    >
      {checked && <IconCheck style={{ width: 14, height: 14 }} />}
    </button>
  );
}