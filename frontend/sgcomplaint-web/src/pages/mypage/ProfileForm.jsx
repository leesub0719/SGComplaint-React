import { useCallback, useState } from 'react';
import { apiPost, ApiError } from '../../shared/api.js';
import PhoneVerification from '../../shared/PhoneVerification.jsx';

const digitsOnly = (value) => String(value || '').replace(/[^0-9]/g, '');

/**
 * 회원정보 수정 폼.
 */
export default function ProfileForm({ profile, onExpired }) {
  const [form, setForm] = useState({
    newPassword: '',
    newPasswordConfirm: '',
    empEmail: profile.empEmail ?? '',
    empPhone: profile.empPhone ?? '',
    phoneVerificationToken: '',
    postcode: profile.postcode ?? '',
    address: profile.address ?? '',
    addressDetail: profile.addressDetail ?? '',
  });
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    newPasswordConfirm: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [alert, setAlert] = useState(null); // {type: 'success' | 'error', message}
  const [saving, setSaving] = useState(false);
  // 저장에 성공하면 "현재 등록된 연락처" 기준값도 갱신해야
  // 재인증을 요구하지 않는다.
  const [originalPhone, setOriginalPhone] = useState(digitsOnly(profile.empPhone));

  const update = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  // PhoneVerification 내부 useEffect가 매 렌더마다 재실행되지 않도록 고정한다.
  const setPhoneToken = useCallback((value) => {
    setForm((previous) =>
      previous.phoneVerificationToken === value
        ? previous
        : { ...previous, phoneVerificationToken: value },
    );
  }, []);

  function searchAddress() {
    if (!window.daum?.Postcode) {
      window.alert('주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        setForm((previous) => ({
          ...previous,
          postcode: data.zonecode,
          address: data.roadAddress || data.jibunAddress,
          addressDetail: '',
        }));
        document.getElementById('profile-address-detail')?.focus();
      },
    }).open();
  }

  async function submit(event) {
    event.preventDefault();
    setAlert(null);

    if (form.newPassword !== form.newPasswordConfirm) {
      setFieldErrors({ newPasswordConfirm: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }
    if (digitsOnly(form.empPhone) !== originalPhone && !form.phoneVerificationToken) {
      setFieldErrors({ empPhone: '변경할 연락처의 인증을 완료해 주세요.' });
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const result = await apiPost('/api/mypage/profile', form);
      setAlert({ type: 'success', message: result.message });
      setOriginalPhone(digitsOnly(form.empPhone));
      setForm((previous) => ({
        ...previous,
        newPassword: '',
        newPasswordConfirm: '',
      }));
    } catch (exception) {
      if (exception instanceof ApiError && exception.status === 403) {
        onExpired();
        return;
      }
      setFieldErrors(exception instanceof ApiError ? exception.fieldErrors : {});
      setAlert({ type: 'error', message: exception.message });
    } finally {
      setSaving(false);
    }
  }

  async function withdraw() {
    if (!window.confirm('회원탈퇴 후에는 로그인할 수 없습니다. 정말 탈퇴하시겠습니까?')) {
      return;
    }
    try {
      await apiPost('/api/mypage/withdraw');
      window.location.href = '/?withdrawn';
    } catch (exception) {
      if (exception instanceof ApiError && exception.status === 403) {
        onExpired();
        return;
      }
      setAlert({ type: 'error', message: exception.message });
    }
  }

  const passwordField = (name, label, placeholder) => (
    <div className="mypage-field">
      <label htmlFor={name}>
        {label} <em>선택</em>
      </label>
      <div className="mypage-password-wrap">
        <input
          id={name}
          type={showPassword[name] ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder={placeholder}
          value={form[name]}
          onChange={(event) => update(name, event.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowPassword((previous) => ({ ...previous, [name]: !previous[name] }))}
        >
          {showPassword[name] ? '숨김' : '보기'}
        </button>
      </div>
      {fieldErrors[name] && <p className="mypage-field-error">{fieldErrors[name]}</p>}
    </div>
  );

  return (
    <section className="mypage-content-panel">
      <div className="mypage-heading">
        <span>MEMBER INFORMATION</span>
        <h1>정보수정</h1>
        <p>가입정보를 확인하고 필요한 항목을 변경할 수 있습니다.</p>
      </div>

      {alert && <p className={`mypage-alert ${alert.type}`}>{alert.message}</p>}

      <form
        className="mypage-profile-form"
        onSubmit={submit}
        noValidate
      >
        <div className="mypage-field">
          <label htmlFor="profile-id">아이디</label>
          <input
            id="profile-id"
            type="text"
            value={profile.empId ?? ''}
            readOnly
          />
          <small>아이디는 변경할 수 없습니다.</small>
        </div>

        <div className="mypage-field">
          <label htmlFor="profile-name">이름</label>
          <input
            id="profile-name"
            type="text"
            value={profile.empName ?? ''}
            readOnly
          />
          <small>이름은 변경할 수 없습니다.</small>
        </div>

        {passwordField('newPassword', '새 비밀번호', '변경할 때만 영문·숫자 포함 8자 이상 입력')}
        {passwordField(
          'newPasswordConfirm',
          '새 비밀번호 확인',
          '새 비밀번호를 다시 입력해 주세요',
        )}

        <div className="mypage-field">
          <label htmlFor="profile-email">
            이메일 <em className="required">필수</em>
          </label>
          <input
            id="profile-email"
            type="email"
            autoComplete="email"
            maxLength={100}
            value={form.empEmail}
            onChange={(event) => update('empEmail', event.target.value)}
            required
          />
          {fieldErrors.empEmail && <p className="mypage-field-error">{fieldErrors.empEmail}</p>}
        </div>

        <div className="mypage-field">
          <label htmlFor="profile-phone">
            연락처 <em className="required">필수</em>
          </label>
          <input
            id="profile-phone"
            type="tel"
            inputMode="numeric"
            maxLength={11}
            value={form.empPhone}
            onChange={(event) => update('empPhone', digitsOnly(event.target.value).slice(0, 11))}
            required
          />
          {fieldErrors.empPhone && <p className="mypage-field-error">{fieldErrors.empPhone}</p>}
          <PhoneVerification
            phone={form.empPhone}
            originalPhone={originalPhone}
            token={form.phoneVerificationToken}
            onTokenChange={setPhoneToken}
            serverError={fieldErrors.phoneVerificationToken}
          />
        </div>

        <fieldset className="mypage-address-fieldset">
          <legend>
            주소 <em>선택</em>
          </legend>
          <div className="mypage-input-action">
            <input
              id="profile-postcode"
              type="text"
              placeholder="우편번호"
              value={form.postcode}
              readOnly
            />
            <button
              type="button"
              onClick={searchAddress}
            >
              주소 검색
            </button>
          </div>
          <input
            id="profile-address"
            type="text"
            placeholder="기본 주소"
            value={form.address}
            readOnly
          />
          <input
            id="profile-address-detail"
            type="text"
            autoComplete="street-address"
            maxLength={100}
            placeholder="상세 주소"
            value={form.addressDetail}
            onChange={(event) => update('addressDetail', event.target.value)}
          />
          {fieldErrors.addressDetail && (
            <p className="mypage-field-error">{fieldErrors.addressDetail}</p>
          )}
        </fieldset>

        <div className="mypage-form-actions profile-actions">
          <button
            className="mypage-primary-button"
            type="submit"
            disabled={saving}
          >
            {saving ? '저장 중…' : '저장'}
          </button>
          <a
            className="mypage-secondary-button"
            href="/app/"
          >
            취소
          </a>
        </div>
      </form>

      <div className="mypage-withdraw-area">
        <div>
          <strong>회원탈퇴</strong>
          <span>탈퇴 후에는 로그인할 수 없으며 기존 문의 기록은 보존됩니다.</span>
        </div>
        <button
          type="button"
          onClick={withdraw}
        >
          회원탈퇴
        </button>
      </div>
    </section>
  );
}
