/**
 * 분류별 화면 문구.
 *
 * 기존에는 ComplaintController.complaintForm()이 Model에 담아 내려주던 값이다
 * (formTitle, formDescription, formHeroImage, titlePlaceholder).
 * 순수한 표현 영역이라 서버 왕복 없이 프론트에서 관리하도록 옮겼다.
 */
export const CATEGORIES = {
  PRAISE: {
    label: '칭찬합니다',
    title: '칭찬합니다 글쓰기',
    description: '친절한 기사님과 기분 좋았던 버스 이용 경험을 들려주세요.',
    heroImage: '/app/images/subpages/praise-hero.png',
    titlePlaceholder: '예시) 013-1 노선차량 오전 기사님을 칭찬하고 싶어요',
  },
  COMPLAINT: {
    label: '불편합니다',
    title: '불편합니다 글쓰기',
    description: '버스 이용 중 겪은 불편 사항이나 개선 의견을 자세히 작성해 주세요.',
    heroImage: '/app/images/subpages/inconvenience-hero.png',
    titlePlaceholder: '예시) 013-1 노선개선일 필요해보여요',
  },
  LOST: {
    label: '분실물 문의',
    title: '분실물 문의 글쓰기',
    description: '버스에서 잃어버린 물건과 이용 정보를 자세히 작성해 주세요.',
    heroImage: '/app/images/subpages/lost-property-hero.png',
    titlePlaceholder: '분실물 제목을 입력해 주세요',
  },
};

export const CATEGORY_CODES = Object.keys(CATEGORIES);

/**
 * ?category=praise 같은 쿼리 문자열을 분류 코드로 바꾼다.
 * 기존 complaint.js의 selectCategoryFromQuery()와 같은 매핑이다.
 */
const QUERY_ALIASES = {
  praise: 'PRAISE',
  schedule: 'COMPLAINT',
  driving: 'COMPLAINT',
  lost: 'LOST',
  complaint: 'COMPLAINT',
};

export function categoryFromQuery(search = window.location.search) {
  const requested = new URLSearchParams(search).get('category');
  if (!requested) return 'COMPLAINT';
  const lower = requested.trim().toLowerCase();
  if (QUERY_ALIASES[lower]) return QUERY_ALIASES[lower];
  const upper = requested.trim().toUpperCase();
  return CATEGORY_CODES.includes(upper) ? upper : 'COMPLAINT';
}
