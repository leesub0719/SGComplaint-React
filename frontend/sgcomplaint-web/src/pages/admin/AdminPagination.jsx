export default function AdminPagination({ page, onChange, radius = 4 }) {
  if (!page || page.totalPages <= 1) return null;
  const start = Math.max(0, page.page - radius);
  const end = Math.min(page.totalPages - 1, page.page + radius);
  const numbers = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  const move = (event, target) => {
    event.preventDefault();
    if (target >= 0 && target < page.totalPages && target !== page.page) onChange(target);
  };

  return (
    <nav
      className="admin-pagination"
      aria-label="페이지 이동"
    >
      <a
        className={page.first ? 'disabled' : ''}
        href="#"
        onClick={(event) => move(event, page.page - 1)}
      >
        이전
      </a>
      {numbers.map((number) => (
        <a
          key={number}
          className={number === page.page ? 'active' : ''}
          aria-current={number === page.page ? 'page' : undefined}
          href="#"
          onClick={(event) => move(event, number)}
        >
          {number + 1}
        </a>
      ))}
      <a
        className={page.last ? 'disabled' : ''}
        href="#"
        onClick={(event) => move(event, page.page + 1)}
      >
        다음
      </a>
    </nav>
  );
}
