import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const NoticeEditor = forwardRef(function NoticeEditor({ initialHtml = '' }, ref) {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const filesRef = useRef([]);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState(
    '이미지 버튼을 누르거나 파일을 내용 칸으로 끌어다 놓으세요. 기존 이미지 포함 최대 5장, 장당 5MB 이하입니다.',
  );
  const [error, setError] = useState(false);

  const sync = () => {
    const text = (editorRef.current?.innerText || '').replace(/\u00a0/g, ' ').trim();
    setCount(text.length);
    setError(false);
  };

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = initialHtml || '';
    sync();
  }, [initialHtml]);

  useImperativeHandle(ref, () => ({
    submission() {
      const editor = editorRef.current;
      const textLength = (editor?.innerText || '').replace(/\u00a0/g, ' ').trim().length;
      if (!textLength || textLength > 3000) {
        setError(true);
        setMessage(
          !textLength
            ? '공지사항 내용을 입력해 주세요.'
            : '공지사항 내용은 3,000자 이내로 입력해 주세요.',
        );
        editor?.focus();
        return null;
      }
      const html = editor.cloneNode(true);
      const files = [];
      html.querySelectorAll('img[data-new-image]').forEach((image) => {
        const file = filesRef.current[Number(image.dataset.newImage)];
        if (!file) return image.remove();
        image.src = `notice-image:${files.length}`;
        image.removeAttribute('data-new-image');
        image.removeAttribute('class');
        files.push(file);
      });
      return { content: html.innerHTML, files };
    },
  }));

  function command(name, value) {
    editorRef.current?.focus();
    document.execCommand(name, false, value || null);
    sync();
  }

  function addImages(files) {
    const editor = editorRef.current;
    if (!editor) return;
    const valid = files.filter(
      (file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_SIZE,
    );
    if (editor.querySelectorAll('img').length + valid.length > MAX_IMAGES) {
      setError(true);
      return setMessage('본문 이미지는 최대 5장까지 등록할 수 있습니다.');
    }
    valid.forEach((file) => {
      const index = filesRef.current.length;
      filesRef.current.push(file);
      const image = document.createElement('img');
      image.src = URL.createObjectURL(file);
      image.alt = file.name;
      image.dataset.newImage = String(index);
      editor.appendChild(image);
      editor.appendChild(document.createElement('br'));
    });
    setError(valid.length !== files.length);
    setMessage(
      valid.length !== files.length
        ? 'JPG, PNG, GIF, WEBP 형식의 5MB 이하 이미지만 등록할 수 있습니다.'
        : '이미지가 본문에 추가되었습니다.',
    );
    sync();
  }

  return (
    <div className="notice-content-field">
      <div className="notice-editor-label">
        <strong>내용</strong>
        <span>
          <b>{count}</b>/3000
        </span>
      </div>
      <div className={error ? 'notice-editor-shell invalid' : 'notice-editor-shell'}>
        <div
          className="notice-editor-toolbar"
          role="toolbar"
          aria-label="공지사항 본문 서식 도구"
        >
          <select
            aria-label="글꼴"
            onChange={(event) => command('fontName', event.target.value)}
          >
            <option value="Malgun Gothic">맑은 고딕</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
          <select
            aria-label="글자 크기"
            defaultValue="3"
            onChange={(event) => command('fontSize', event.target.value)}
          >
            <option value="2">작게</option>
            <option value="3">보통</option>
            <option value="4">크게</option>
            <option value="5">매우 크게</option>
          </select>
          <span
            className="notice-toolbar-divider"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => command('bold')}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => command('italic')}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => command('underline')}
          >
            <u>U</u>
          </button>
          <button
            type="button"
            onClick={() => command('insertUnorderedList')}
          >
            • 목록
          </button>
          <button
            type="button"
            onClick={() => command('insertOrderedList')}
          >
            1. 목록
          </button>
          <button
            type="button"
            onClick={() => command('removeFormat')}
          >
            서식 지우기
          </button>
          <span
            className="notice-toolbar-divider"
            aria-hidden="true"
          />
          <button
            className="notice-image-button"
            type="button"
            onClick={() => imageInputRef.current?.click()}
          >
            ▧ 이미지
          </button>
        </div>
        <div
          ref={editorRef}
          className="notice-editor"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder="공지사항 내용을 입력하거나 이미지를 끌어다 놓아 주세요."
          onInput={sync}
          onPaste={(event) => {
            event.preventDefault();
            document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addImages(Array.from(event.dataTransfer.files));
          }}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          hidden
          onChange={(event) => {
            addImages(Array.from(event.target.files));
            event.target.value = '';
          }}
        />
      </div>
      <p
        className={error ? 'notice-editor-message error' : 'notice-editor-message'}
        aria-live="polite"
      >
        {message}
      </p>
    </div>
  );
});

export default NoticeEditor;
