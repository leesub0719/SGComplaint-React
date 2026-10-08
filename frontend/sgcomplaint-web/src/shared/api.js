/**
 * 서버 통신 공통 모듈.
 *
 * 전환 초기에는 화면별로 앱을 나눠 만들면서 이 파일이 네 벌로 복제돼 있었다
 * (mypage / account / complaint-form / admin). 통합하면서 하나로 합쳤다.
 *
 * 여기서 처리하는 것:
 *  - CSRF 토큰을 /api/csrf 에서 한 번만 받아 캐싱하고 POST 헤더에 주입
 *  - 세션 만료(로그인 페이지로 리다이렉트되는 응답) 감지
 *  - 서버가 내려주는 message / fieldErrors 를 예외로 변환
 */

let csrfPromise = null;

/** 서버가 내려준 필드별 오류를 함께 들고 다니는 에러. */
export class ApiError extends Error {
  constructor(message, { fieldErrors = {}, status = 0 } = {}) {
    super(message);
    this.name = 'ApiError';
    this.fieldErrors = fieldErrors;
    this.status = status;
  }
}

function loadCsrf() {
  if (!csrfPromise) {
    csrfPromise = fetch('/api/csrf', { credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) {
          throw new ApiError('보안 토큰을 가져오지 못했습니다.', { status: response.status });
        }
        return response.json();
      })
      .catch((error) => {
        csrfPromise = null; // 다음 요청에서 다시 시도할 수 있게 캐시를 비운다.
        throw error;
      });
  }
  return csrfPromise;
}

/**
 * 로그인이 풀렸는지 확인한다.
 *
 * @param {boolean} redirect 세션이 끊겼을 때 로그인 페이지로 보낼지 여부.
 *        폼 제출 중이라면 사용자에게 메시지를 먼저 보여주는 편이 낫다.
 */
function checkAccess(response, redirect = true) {
  const isLoginRedirect = response.redirected && response.url.includes('/login');
  if (response.status === 401 || isLoginRedirect) {
    if (redirect) window.location.href = '/app/login';
    throw new ApiError('로그인 시간이 만료되었습니다. 다시 로그인해 주세요.', { status: 401 });
  }
}

/** Spring Security 로그아웃을 CSRF 보호가 적용된 POST 요청으로 실행한다. */
export async function logout() {
  const csrf = await loadCsrf();
  const form = document.createElement('form');
  form.method = 'post';
  form.action = '/logout';

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = csrf.parameterName || '_csrf';
  input.value = csrf.token;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}

async function parse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || '요청을 처리하지 못했습니다.', {
      fieldErrors: data?.fieldErrors || {},
      status: response.status,
    });
  }
  return data;
}

export async function apiGet(url, { redirectOnExpire = true } = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  checkAccess(response, redirectOnExpire);
  return parse(response);
}

export async function apiPost(url, body, { redirectOnExpire = true } = {}) {
  const csrf = await loadCsrf();
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      [csrf.headerName]: csrf.token,
    },
    body: JSON.stringify(body ?? {}),
  });
  checkAccess(response, redirectOnExpire);
  return parse(response);
}

async function apiWrite(method, url, body, { redirectOnExpire = true } = {}) {
  const csrf = await loadCsrf();
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      [csrf.headerName]: csrf.token,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  checkAccess(response, redirectOnExpire);
  return parse(response);
}

export const apiPut = (url, body, options) => apiWrite('PUT', url, body, options);
export const apiPatch = (url, body, options) => apiWrite('PATCH', url, body, options);
export const apiDelete = (url, options) => apiWrite('DELETE', url, undefined, options);

/**
 * 첨부파일이 있는 요청(민원 등록, 관리자 답변)은 multipart/form-data로 보낸다.
 * Content-Type은 브라우저가 boundary와 함께 붙이므로 직접 지정하지 않는다.
 */
export async function postFormData(url, formData, { redirectOnExpire = false } = {}) {
  const csrf = await loadCsrf();
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { [csrf.headerName]: csrf.token, Accept: 'application/json' },
    body: formData,
  });
  checkAccess(response, redirectOnExpire);

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new ApiError('서버 응답을 처리할 수 없습니다. 다시 로그인해 주세요.', {
      status: response.status,
    });
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success === false) {
    throw new ApiError(data?.message || '요청을 처리하지 못했습니다.', {
      status: response.status,
    });
  }
  return data;
}

/**
 * 휴대전화 인증 API는 {success, message, verificationToken} 형태라
 * 다른 API와 응답 규격이 다르다. 서버 응답 포맷을 통일하기 전까지 여기서 흡수한다.
 */
export async function postPhoneVerification(url, body) {
  const data = await apiPost(url, body, { redirectOnExpire: false });
  if (data?.success !== true) {
    throw new ApiError(data?.message || '요청 처리에 실패했습니다.');
  }
  return data;
}
