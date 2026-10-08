/**
 * 페이지 이동 버튼.
 * 서버가 내려준 AdminPageResponse의 first/last/totalPages를 그대로 쓴다.
 */
export default function Pagination({ page }) {
  if (!page || page.totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button type="button" disabled={page.first} onClick={() => page.onChange(page.page - 1)}>
        이전
      </button>
      <span>{page.page + 1} / {page.totalPages}</span>
      <button type="button" disabled={page.last} onClick={() => page.onChange(page.page + 1)}>
        다음
      </button>
    </div>
  );
}
