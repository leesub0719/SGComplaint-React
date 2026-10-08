import { useSearchParams } from 'react-router-dom';

/** 현재 React 경로에 맞는 서브 페이지 상단 이미지를 표시한다. */
export default function SubHero({ pathname }) {
  const [params] = useSearchParams();
  const hero = resolve(pathname, params.get('category'));
  if (!hero) return null;

  return (
    <section
      className="subpage-hero"
      aria-label={`${hero.title} 페이지 상단 이미지`}
    >
      <img
        src={hero.image}
        alt="노란 버스와 시민이 함께 있는 거리 풍경"
      />
      <div
        className="subpage-hero-shade"
        aria-hidden="true"
      />
      <div className="subpage-hero-copy">
        <h1>{hero.title}</h1>
      </div>
    </section>
  );
}

const CATEGORY_HERO = {
  PRAISE: { image: '/app/images/subpages/praise-hero.png', title: '칭찬합니다' },
  COMPLAINT: { image: '/app/images/subpages/inconvenience-hero.png', title: '불편합니다' },
  LOST: { image: '/app/images/subpages/lost-property-hero.png', title: '분실물 문의' },
};

function resolve(pathname, category) {
  if (pathname === '/login') {
    return { image: '/app/images/subpages/login-hero.png', title: '로그인' };
  }
  if (pathname.startsWith('/notices/')) {
    return { image: '/app/images/subpages/notice-detail-hero.png', title: '공지사항' };
  }
  if (pathname.startsWith('/notices')) {
    return { image: '/app/images/subpages/notices-hero.png', title: '공지사항' };
  }
  if (pathname === '/company/greeting') {
    return { image: '/app/images/subpages/company-greeting-hero.png', title: '인사말' };
  }
  if (pathname === '/company/history') {
    return { image: '/app/images/subpages/company-history-hero.png', title: '회사연혁' };
  }
  if (pathname === '/company/location') {
    return { image: '/app/images/subpages/company-location-hero.png', title: '오시는길' };
  }
  if (pathname === '/company/organization') {
    return { image: '/app/images/subpages/company-organization-hero.png', title: '조직도' };
  }
  if (pathname === '/route/ddokbus') {
    return { image: '/app/images/subpages/ddokbus-hero.png', title: '똑버스' };
  }
  if (pathname.startsWith('/route')) {
    return { image: '/app/images/subpages/village-bus-hero.png', title: '마을버스' };
  }
  if (pathname.startsWith('/recruit')) {
    return { image: '/app/images/subpages/recruit-notices-hero.png', title: '채용공고' };
  }
  if (pathname.startsWith('/complaints/new')) {
    return (
      CATEGORY_HERO[category] ?? {
        image: '/app/images/subpages/complaint-write-hero.png',
        title: '민원 접수',
      }
    );
  }
  if (pathname.startsWith('/complaints')) {
    return (
      CATEGORY_HERO[category] ?? {
        image: '/app/images/subpages/complaints-all-hero.png',
        title: '고객의 소리',
      }
    );
  }
  if (pathname.startsWith('/mypage')) {
    return { image: '/app/images/subpages/signup-hero.png', title: '마이페이지' };
  }
  if (pathname.startsWith('/account')) {
    return { image: '/app/images/subpages/signup-hero.png', title: '회원가입' };
  }
  return null;
}
