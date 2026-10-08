/** 첨부파일 제약 — 서버 UploadValidation 및 기존 complaint.js와 같은 기준. */
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPT = '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.hwp,.hwpx';

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 선택한 파일 목록을 검증한다.
 *
 * 기존 코드는 제한을 넘으면 선택 전체를 비웠지만, 여기서는 목록을 유지한 채
 * 오류 메시지만 돌려준다. 사용자가 어떤 파일이 문제인지 보고 그것만 지울 수 있다.
 */
export function validateFiles(files) {
  if (files.length > MAX_FILES) {
    return `첨부파일은 최대 ${MAX_FILES}개까지 선택할 수 있습니다.`;
  }
  const tooLarge = files.find((file) => file.size > MAX_FILE_BYTES);
  if (tooLarge) {
    return `파일 한 개의 크기는 10MB를 넘을 수 없습니다. (${tooLarge.name})`;
  }
  return '';
}

/** 같은 파일을 두 번 고르는 것을 막는다. */
export function mergeFiles(existing, incoming) {
  const key = (file) => `${file.name}:${file.size}:${file.lastModified}`;
  const seen = new Set(existing.map(key));
  return existing.concat(incoming.filter((file) => !seen.has(key(file))));
}
