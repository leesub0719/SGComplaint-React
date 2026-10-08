import { useRef } from 'react';
import { ACCEPT, MAX_FILES, formatBytes, mergeFiles, validateFiles } from './files.js';

/**
 * 첨부파일 선택 목록.
 *
 * 기존 complaint.js는 DataTransfer로 <input type="file">의 FileList를 직접
 * 다시 만들어 동기화했다. React에서는 선택한 File 배열을 상태로 들고 있다가
 * 제출 시점에 FormData에 넣으면 되므로 그 처리가 필요 없다.
 */
export default function AttachmentPicker({ files, onChange, message, onMessage }) {
  const inputRef = useRef(null);

  function addFiles(fileList) {
    const merged = mergeFiles(files, Array.from(fileList));
    const error = validateFiles(merged);
    onMessage(error);
    // 제한을 넘어도 목록은 유지해서, 어떤 파일을 빼야 하는지 보이게 한다.
    onChange(merged);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(index) {
    const next = files.filter((_, position) => position !== index);
    onChange(next);
    onMessage(validateFiles(next));
  }

  return (
    <div className="form-field">
      <label htmlFor="complaint-files">첨부파일</label>

      <label className="file-drop" htmlFor="complaint-files">
        <strong>파일 선택</strong>
        <span>사진이나 문서를 최대 {MAX_FILES}개까지 첨부할 수 있습니다.</span>
      </label>
      <input
        id="complaint-files"
        ref={inputRef}
        className="sr-only"
        type="file"
        multiple
        accept={ACCEPT}
        onChange={(event) => addFiles(event.target.files)}
      />

      <div className="file-list-heading">
        <span>첨부파일 {files.length}개</span>
        {files.length > 0 && (
          <button type="button" onClick={() => { onChange([]); onMessage(''); }}>
            전체 취소
          </button>
        )}
      </div>

      <ul className="file-list" aria-live="polite">
        {files.map((file, index) => (
          <li key={`${file.name}-${file.lastModified}`}>
            <div className="file-information">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{formatBytes(file.size)}</span>
            </div>
            <button
              type="button"
              className="file-cancel"
              aria-label={`${file.name} 첨부 취소`}
              onClick={() => removeAt(index)}
            >
              취소
            </button>
          </li>
        ))}
      </ul>

      {message && <p className="field-message error" aria-live="polite">{message}</p>}
    </div>
  );
}
