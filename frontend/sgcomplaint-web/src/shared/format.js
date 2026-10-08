export const digitsOnly = (value) => String(value || '').replace(/[^0-9]/g, '');

export const normalizePhone = (value) => digitsOnly(value).slice(0, 11);

export const formatPhone = (value) =>
  String(value || '').replace(/^(01\d)(\d{3,4})(\d{4})$/, '$1-$2-$3');

export const normalizeEmpId = (value) =>
  String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const PHONE_PATTERN = /^01[0-9]{8,9}$/;
export const CODE_PATTERN = /^[0-9]{6}$/;
export const EMP_ID_PATTERN = /^[a-z0-9]{4,20}$/;

/** 서버의 EmployeeSignupRequest / PasswordResetRequest와 같은 규칙. */
export const isValidPassword = (value) =>
  typeof value === 'string'
  && value.length >= 8
  && value.length <= 72
  && /[A-Za-z]/.test(value)
  && /[0-9]/.test(value);

export const formatTimer = (seconds) => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const rest = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
};
