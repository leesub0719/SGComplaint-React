import { useCallback, useEffect, useRef, useState } from 'react';
import { apiDelete, apiGet, postFormData } from '../../shared/api.js';

export default function MainPage() {
  const [data, setData] = useState({ banners: [], count: 0, remainingCount: 5 });
  const [names, setNames] = useState('선택된 이미지가 없습니다.');
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const load = useCallback(() => apiGet('/api/admin/main-page').then(setData).catch((reason) => setError(reason.message)), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (data.remainingCount === 0) setNames('최대 5장이 모두 등록되어 있습니다.'); }, [data.remainingCount]);

  async function upload(event) {
    event.preventDefault();
    const files = Array.from(inputRef.current?.files || []);
    if (!files.length) return setError('등록할 배너 이미지를 선택해 주세요.');
    if (files.length > data.remainingCount) return setError(`현재 ${data.remainingCount}장까지 추가할 수 있습니다.`);
    const body = new FormData(); files.forEach((file) => body.append('bannerImages', file));
    setSaving(true); setError('');
    try { setMessage((await postFormData('/api/admin/main-page/banners', body)).message); event.currentTarget.reset(); setNames('선택된 이미지가 없습니다.'); await load(); }
    catch (reason) { setError(reason.message); } finally { setSaving(false); }
  }
  async function remove(no) {
    if (!window.confirm('이 메인 배너 이미지를 삭제하시겠습니까?')) return;
    try { setMessage((await apiDelete(`/api/admin/main-page/banners/${no}`)).message); setError(''); await load(); }
    catch (reason) { setError(reason.message); }
  }

  return <>
    {message && <div className="flash-message success">{message}</div>}{error && <div className="flash-message error">{error}</div>}
    <section className="banner-summary-grid" aria-label="메인 배너 현황"><article><span>등록된 배너</span><strong>{data.count}</strong><small>최대 5장</small></article><article><span>추가 가능</span><strong>{data.remainingCount}</strong><small>남은 등록 수</small></article><article><span>자동 전환</span><strong>5초</strong><small>마우스를 올리면 일시정지</small></article></section>
    <section className="admin-panel main-banner-panel"><div className="panel-heading"><div><h2>상단 메인 배너</h2></div><a href="/app/" target="_blank" rel="noreferrer">메인 화면 확인 →</a></div>
      <form className="main-banner-upload" onSubmit={upload}><label htmlFor="banner-images"><span className="banner-upload-icon">＋</span><strong>메인 배너 이미지 선택</strong><small>JPG, PNG, 정지 WEBP · 장당 최대 10MB · 전체 최대 5장 · 가로·세로 10,000px 및 2,000만 화소 이하</small></label><input ref={inputRef} id="banner-images" type="file" name="bannerImages" multiple required accept=".jpg,.jpeg,.png,.webp" disabled={data.remainingCount === 0} onChange={(event) => setNames(Array.from(event.target.files).map((file) => file.name).join(', ') || '선택된 이미지가 없습니다.')} /><p>{names}</p><button type="submit" disabled={data.remainingCount === 0 || saving}>{saving ? '등록 중...' : '배너 등록'}</button></form>
      {data.banners.length ? <div className="main-banner-list">{data.banners.map((banner, index) => <article className="main-banner-card" key={banner.bannerNo}><div className="banner-order">{index + 1}</div><div className="banner-preview"><img src={banner.imageUrl} alt={banner.originalName} /></div><div className="banner-information"><strong>{banner.originalName}</strong><p><span>{banner.formattedSize}</span> · <span>{banner.createdDateTime}</span></p><small>등록 관리자 <b>{banner.createdBy}</b></small></div><form onSubmit={(event) => { event.preventDefault(); remove(banner.bannerNo); }}><button type="submit">삭제</button></form></article>)}</div>
        : <div className="main-banner-empty"><span>▧</span><strong>등록된 메인 배너가 없습니다.</strong><p>현재는 기본 버스 이미지가 메인 화면에 표시됩니다.</p></div>}
    </section>
  </>;
}
