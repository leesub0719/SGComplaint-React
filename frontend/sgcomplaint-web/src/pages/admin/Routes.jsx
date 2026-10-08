import { useCallback, useEffect, useRef, useState } from 'react';
import { apiDelete, apiGet, apiPost, apiPut, postFormData } from '../../shared/api.js';

const EMPTY = {
  routeType: 'VILLAGE',
  busName: '',
  terminalInfo: '',
  dispatchInterval: '',
  inquiryPhone: '',
  routeUrl: '',
};
const FIELDS = [
  ['busName', '버스이름', '예: 마을버스 013'],
  ['terminalInfo', '기점-종점', '예: 소사역 - 역곡역'],
  ['dispatchInterval', '배차간격', '예: 평일 10분 / 토·일요일 15분'],
  ['inquiryPhone', '문의전화', '예: 032-342-3223'],
  ['routeUrl', '노선안내 링크', 'https://...'],
];

export default function AdminRoutes() {
  const [data, setData] = useState({
    routes: [],
    guideImages: [],
    routeCount: 0,
    guideImageCount: 0,
  });
  const [form, setForm] = useState(EMPTY);
  const [edits, setEdits] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const imageRef = useRef(null);
  const load = useCallback(
    () =>
      apiGet('/api/admin/routes')
        .then(setData)
        .catch((reason) => setError(reason.message)),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);

  async function save(event) {
    event.preventDefault();
    setError('');
    try {
      let result;
      if (form.routeType === 'DDOK') {
        const image = imageRef.current?.files?.[0];
        if (!image) throw new Error('똑버스 안내 이미지를 선택해 주세요.');
        const body = new FormData();
        body.append('guideImage', image);
        result = await postFormData('/api/admin/routes/guide-images', body);
      } else {
        result = await apiPost('/api/admin/routes', form);
      }
      setMessage(result.message);
      setForm(EMPTY);
      event.currentTarget.reset();
      await load();
    } catch (reason) {
      setError(reason.message);
    }
  }
  async function update(no, event) {
    event.preventDefault();
    try {
      setMessage(
        (await apiPut(`/api/admin/routes/${no}`, { ...edits[no], routeType: 'VILLAGE' })).message,
      );
      setError('');
      await load();
    } catch (reason) {
      setError(reason.message);
    }
  }
  async function remove(no) {
    if (!window.confirm('이 운행안내를 삭제하시겠습니까?')) return;
    try {
      setMessage((await apiDelete(`/api/admin/routes/${no}`)).message);
      setError('');
      await load();
    } catch (reason) {
      setError(reason.message);
    }
  }
  async function removeImage(no) {
    if (!window.confirm('이 똑버스 안내 이미지를 삭제하시겠습니까?')) return;
    try {
      setMessage((await apiDelete(`/api/admin/routes/guide-images/${no}`)).message);
      setError('');
      await load();
    } catch (reason) {
      setError(reason.message);
    }
  }
  function editValue(route, key) {
    return edits[route.routeNo]?.[key] ?? route[key] ?? '';
  }
  function changeEdit(route, key, value) {
    setEdits((old) => ({
      ...old,
      [route.routeNo]: { ...route, ...old[route.routeNo], [key]: value },
    }));
  }

  return (
    <>
      {message && <div className="flash-message success">{message}</div>}
      {error && <div className="flash-message error">{error}</div>}
      <section className="route-admin-summary">
        <div>
          <small>마을버스 노선</small>
          <strong>{data.routeCount}</strong>
          <span>개</span>
          <small>똑버스 이미지</small>
          <strong>{data.guideImageCount}</strong>
          <span>장</span>
        </div>
        <a
          href="/app/route/village-bus"
          target="_blank"
          rel="noreferrer"
        >
          사용자 화면 보기 ↗
        </a>
      </section>
      <section className="admin-panel route-admin-panel">
        <header className="route-admin-heading">
          <div>
            <h2>새 운행안내 등록</h2>
            <p>입력한 정보는 해당 사용자 노선 탭에 즉시 표시됩니다.</p>
          </div>
        </header>
        <form
          className="route-admin-form"
          onSubmit={save}
        >
          <label>
            운행 유형 <b>*</b>
            <select
              value={form.routeType}
              onChange={(event) => setForm({ ...form, routeType: event.target.value })}
            >
              <option value="VILLAGE">마을버스</option>
              <option value="DDOK">똑버스</option>
            </select>
          </label>
          {form.routeType === 'VILLAGE' ? (
            <div className="route-village-fields">
              {FIELDS.map(([key, label, placeholder]) => (
                <label
                  className={key === 'terminalInfo' || key === 'dispatchInterval' ? 'wide' : ''}
                  key={key}
                >
                  {label} <b>*</b>
                  <input
                    value={form[key]}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    maxLength={
                      key === 'routeUrl'
                        ? 500
                        : key === 'busName' || key === 'inquiryPhone'
                          ? 100
                          : 200
                    }
                    placeholder={placeholder}
                    required
                  />
                </label>
              ))}
            </div>
          ) : (
            <div className="route-ddok-image-field">
              <label>
                똑버스 안내 이미지 <b>*</b>
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                />
                <small>
                  JPG, PNG, 정지 WEBP · 최대 10MB · 가로·세로 10,000px 및 2,000만 화소 이하
                </small>
              </label>
            </div>
          )}
          <button type="submit">운행안내 등록</button>
        </form>
      </section>
      <section className="admin-panel route-list-panel">
        <header className="route-admin-heading">
          <div>
            <h2>등록된 운행안내</h2>
            <p>등록 순서대로 사용자 화면 왼쪽 위부터 배치됩니다.</p>
          </div>
        </header>
        <div className="route-admin-list">
          {data.routes.map((route) => (
            <article key={route.routeNo}>
              <div className="route-admin-row">
                <span className="route-type-badge">{route.routeTypeLabel}</span>
                <strong>{route.busName}</strong>
                <span>{route.terminalInfo}</span>
                <a
                  href={route.routeUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  링크 열기 ↗
                </a>
                <details
                  onToggle={(event) => {
                    if (event.currentTarget.open)
                      setEdits((old) => ({ ...old, [route.routeNo]: old[route.routeNo] || route }));
                  }}
                >
                  <summary>수정</summary>
                  <form
                    className="route-edit-form"
                    onSubmit={(event) => update(route.routeNo, event)}
                  >
                    {FIELDS.map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          value={editValue(route, key)}
                          onChange={(event) => changeEdit(route, key, event.target.value)}
                          required
                        />
                      </label>
                    ))}
                    <button type="submit">수정 저장</button>
                  </form>
                </details>
                <form
                  className="route-delete-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    remove(route.routeNo);
                  }}
                >
                  <button type="submit">삭제</button>
                </form>
              </div>
            </article>
          ))}
          {!data.routes.length && <div className="table-empty">등록된 운행안내가 없습니다.</div>}
        </div>
      </section>
      <section className="admin-panel route-list-panel">
        <header className="route-admin-heading">
          <div>
            <h2>똑버스 안내 이미지</h2>
            <p>등록된 순서대로 사용자 똑버스 탭 중앙에 표시됩니다.</p>
          </div>
        </header>
        <div className="ddok-admin-image-list">
          {data.guideImages.map((image) => (
            <article key={image.imageNo}>
              <img
                src={image.imageUrl}
                alt="똑버스 안내 이미지 미리보기"
              />
              <div>
                <strong>{image.originalName}</strong>
                <span>
                  <b>{image.formattedSize}</b> · <time>{image.createdDateTime}</time>
                </span>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  removeImage(image.imageNo);
                }}
              >
                <button type="submit">삭제</button>
              </form>
            </article>
          ))}
          {!data.guideImages.length && (
            <div className="table-empty">등록된 똑버스 안내 이미지가 없습니다.</div>
          )}
        </div>
      </section>
    </>
  );
}
