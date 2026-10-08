import { NavLink } from 'react-router-dom';

export default function Greeting() {
  return (
    <>
      <nav
        className="company-local-nav"
        aria-label="회사소개 하위 메뉴"
      >
        <div className="company-page-width">
          <NavLink to="/company/greeting">인사말</NavLink>
          <NavLink to="/company/history">회사연혁</NavLink>
          <NavLink to="/company/location">오시는길</NavLink>
          <NavLink to="/company/organization">조직도</NavLink>
        </div>
      </nav>
      <main className="company-greeting-main">
        <section className="greeting-introduction">
          <div className="greeting-image-column">
            <figure className="greeting-image-frame">
              <img
                src="/app/images/subpages/company-greeting-hero.png"
                alt="노란색 서경운수 버스와 시민이 함께하는 거리 풍경"
              />
            </figure>
            <div className="greeting-image-caption">
              <strong>안전한 오늘, 편안한 내일</strong>
              <span>시민의 일상과 함께 달리겠습니다.</span>
            </div>
          </div>
          <article className="greeting-message">
            <h1>
              시민의 일상과 함께하는
              <br />
              <strong>서경운수</strong> 홈페이지에 오신 것을 환영합니다.
            </h1>
            <div className="greeting-copy">
              <p>서경운수 홈페이지를 방문해 주신 고객 여러분께 진심으로 감사드립니다.</p>
              <p>
                서경운수는 시민 여러분의 안전하고 편리한 이동을 위해 항상 고객의 입장에서 생각하며
                운행하고 있습니다. 버스는 단순한 이동수단을 넘어 시민의 일상과 지역을 연결하는
                소중한 대중교통이라고 생각합니다.
              </p>
              <p>
                저희 임직원은 안전운행을 가장 중요한 가치로 삼고, 친절한 서비스와 안정적인 운행을
                제공하기 위해 지속적으로 노력하겠습니다. 고객 여러분이 보내주시는 칭찬과
                불편사항에도 귀 기울이며 더욱 신뢰받는 버스회사가 되겠습니다.
              </p>
              <p>
                앞으로도 지역사회와 함께 성장하고 시민 여러분이 안심하고 이용할 수 있는 대중교통
                서비스를 만들어 가겠습니다. 변함없는 관심과 성원을 부탁드립니다.
              </p>
              <p>감사합니다.</p>
            </div>
            <p className="greeting-signature">
              <span>주식회사 서경운수</span>
              <strong>임직원 일동</strong>
            </p>
          </article>
        </section>
        <section className="company-promises">
          <div className="company-promises-heading">
            <h2>시민과 함께하는 서경운수의 약속</h2>
          </div>
          <div className="company-promise-list">
            <Promise
              number="01"
              icon="✓"
              title="안전운행"
            >
              철저한 차량 관리와 안전수칙 준수로 안심할 수 있는 이동을 만들겠습니다.
            </Promise>
            <Promise
              number="02"
              icon="♡"
              title="친절서비스"
            >
              모든 승객을 존중하고 배려하는 따뜻한 서비스로 함께하겠습니다.
            </Promise>
            <Promise
              number="03"
              icon="◌"
              title="고객소통"
            >
              고객의 의견에 귀 기울이고 더 나은 운행 서비스에 적극 반영하겠습니다.
            </Promise>
          </div>
        </section>
      </main>
    </>
  );
}

function Promise({ number, icon, title, children }) {
  return (
    <article>
      <span className="promise-number">{number}</span>
      <span className="promise-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
