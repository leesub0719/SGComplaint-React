/**
 * 민원 목록에서 한 건의 데이터를 한 줄(<tr>)로 표시한다.
 * 부모 컴포넌트인 List.jsx로부터 item을 props로 전달받는다.
 */
export default function ComplaintRow({ item, onOpen }) {
  return (
    <tr>
      <td>{item.complaintNo}</td>
      <td>
        <span className={`category-label category-${item.categoryCode.toLowerCase()}`}>
          {item.categoryLabel}
        </span>
      </td>
      <td>
        <span className={`complaint-status status-${item.statusCode.toLowerCase()}`}>
          {item.statusLabel}
        </span>
      </td>
      <td className="title-cell">
        <button type="button" onClick={() => onOpen(item)}>
          {item.passwordProtected && <span className="lock-icon">🔒</span>} <span>{item.title}</span>
        </button>
      </td>
      <td>{item.maskedWriterName}</td>
      <td>{item.registeredDate}</td>
    </tr>
  );
}
