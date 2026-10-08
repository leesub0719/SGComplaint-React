import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { postFormData, ApiError } from '../../shared/api.js';
import { CATEGORIES, CATEGORY_CODES, categoryFromQuery } from './categories.js';
import { validateFiles } from './files.js';
import RichTextEditor from './RichTextEditor.jsx';
import AttachmentPicker from './AttachmentPicker.jsx';
import CompleteModal from './CompleteModal.jsx';

const TITLE_MAX = 100;
const CONTENT_MAX = 2000;

/**
 * 민원 작성 화면.
 *
 * 서버의 POST /complaints는 이미 JSON을 반환하는 API라(@ResponseBody +
 * ComplaintCreateResponse) 백엔드 변경 없이 그대로 호출한다.
 */
export default function ComplaintNew() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(categoryFromQuery(`?${params}`));
  const [title, setTitle] = useState('');
  const [postPassword, setPostPassword] = useState('');
  const [content, setContent] = useState({ html: '', length: 0 });
  const [files, setFiles] = useState([]);
  const [fileMessage, setFileMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [formMessage, setFormMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complaintNo, setComplaintNo] = useState(null);

  const meta = CATEGORIES[category];
  const contentValid = content.length > 0 && content.length <= CONTENT_MAX;

  function validate() {
    const next = {};
    if (!CATEGORY_CODES.includes(category)) next.category = '민원 분류를 선택해 주세요.';
    if (!title.trim()) next.title = '제목을 입력해 주세요.';
    if (postPassword.length < 4 || postPassword.length > 20) {
      next.postPassword = '게시글 비밀번호는 4~20자로 입력해 주세요.';
    }
    if (!contentValid) {
      next.content = content.length === 0
        ? '내용을 입력해 주세요.'
        : `내용은 ${CONTENT_MAX}자 이내로 입력해 주세요.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    setFormMessage('');

    if (!validate()) {
      setFormMessage('필수 입력 항목을 확인해 주세요.');
      return;
    }
    const fileError = validateFiles(files);
    if (fileError) {
      setFileMessage(fileError);
      setFormMessage('첨부파일을 다시 확인해 주세요.');
      return;
    }

    // 서버는 @ModelAttribute + MultipartFile 이므로 multipart/form-data로 보낸다.
    const formData = new FormData();
    formData.append('category', category);
    formData.append('title', title);
    formData.append('content', content.html);
    formData.append('postPassword', postPassword);
    files.forEach((file) => formData.append('attachments', file));

    setSubmitting(true);
    try {
      const result = await postFormData('/complaints', formData);
      setComplaintNo(result.complaintNo);
    } catch (exception) {
      setFormMessage(exception.message);
      if (exception instanceof ApiError && exception.status === 401) {
        window.setTimeout(() => { window.location.href = '/login'; }, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <main className="page">
        {/* 분류별 안내 문구. 제목은 상단 SubHero가 보여준다. */}
        <div className="page-heading">
          <h1>{meta.title}</h1>
          <span>{meta.description}</span>
        </div>

        <section className="form-card">
          <div className="form-card-header">
            <div>
              <span className="step">STEP 01</span>
              <h2>민원 내용 작성</h2>
            </div>
            <p><em>*</em> 표시는 필수 입력 항목입니다.</p>
          </div>

          <form onSubmit={submit} noValidate>
            <div className="row">
              <div className="form-field">
                <label htmlFor="complaint-category">분류 <em>*</em></label>
                <select
                  id="complaint-category"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    // 상단 히어로 이미지가 분류를 따라가도록 URL도 갱신한다.
                    setParams({ category: event.target.value }, { replace: true });
                  }}
                >
                  {CATEGORY_CODES.map((code) => (
                    <option key={code} value={code}>{CATEGORIES[code].label}</option>
                  ))}
                </select>
                <p className="field-help">접수하려는 내용과 가장 가까운 분류를 선택해 주세요.</p>
                {errors.category && <p className="field-message error">{errors.category}</p>}
              </div>

              <div className="form-field">
                <label htmlFor="post-password">게시글 비밀번호 <em>*</em></label>
                <input
                  id="post-password"
                  type="password"
                  minLength={4}
                  maxLength={20}
                  autoComplete="new-password"
                  placeholder="4~20자로 입력해 주세요"
                  value={postPassword}
                  onChange={(event) => setPostPassword(event.target.value)}
                />
                <p className="field-help">게시글을 열람할 때 사용하는 비밀번호입니다.</p>
                {errors.postPassword && <p className="field-message error">{errors.postPassword}</p>}
              </div>
            </div>

            <div className="form-field">
              <div className="label-row">
                <label htmlFor="complaint-title">제목 <em>*</em></label>
                <span><strong>{title.length}</strong>/{TITLE_MAX}</span>
              </div>
              <input
                id="complaint-title"
                type="text"
                maxLength={TITLE_MAX}
                placeholder={meta.titlePlaceholder}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              {errors.title && <p className="field-message error">{errors.title}</p>}
            </div>

            <div className="form-field">
              <div className="label-row">
                <label>내용 <em>*</em></label>
                <span
                  className={content.length > CONTENT_MAX ? 'over-limit' : ''}
                >
                  <strong>{content.length}</strong>/{CONTENT_MAX}
                </span>
              </div>
              <RichTextEditor
                invalid={Boolean(errors.content)}
                onChange={(html, length) => {
                  setContent({ html, length });
                  setErrors((previous) => ({ ...previous, content: undefined }));
                }}
              />
              <p className="field-help">개인정보나 주민등록번호 등 민감한 정보는 작성하지 마세요.</p>
              {errors.content && <p className="field-message error">{errors.content}</p>}
            </div>

            <AttachmentPicker
              files={files}
              onChange={setFiles}
              message={fileMessage}
              onMessage={setFileMessage}
            />

            {formMessage && <p className="form-message" aria-live="polite">{formMessage}</p>}

            <div className="form-actions">
              <Link className="button button-cancel" to="/complaints">취소</Link>
              <button className="button button-submit" type="submit" disabled={submitting}>
                {submitting ? '접수 중...' : '접수하기'}
              </button>
            </div>
          </form>
        </section>
      </main>

      {complaintNo != null && (
        <CompleteModal
          complaintNo={complaintNo}
          onConfirm={() => navigate('/complaints')}
        />
      )}
    </>
  );
}
