import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 인증번호 유효시간 카운트다운.
 *
 * find-id.js / reset-password.js / mypage.js 에 세 번 중복되어 있던
 * setInterval + clearInterval 패턴을 하나의 훅으로 모았다.
 * 컴포넌트가 사라지면 useEffect cleanup이 타이머를 자동으로 정리한다.
 *
 * @param {number} seconds 시작 초 (기본 180초)
 * @param {() => void} onExpire 0이 되는 순간 한 번 호출
 */
export default function useCountdown(seconds = 180, onExpire) {
  const [remaining, setRemaining] = useState(0);
  const onExpireRef = useRef(onExpire);

  // 콜백이 매 렌더 새로 만들어져도 타이머를 다시 켜지 않도록 ref에 담아둔다.
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);
  const stop = useCallback(() => setRemaining(0), []);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const id = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          onExpireRef.current?.();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [remaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  return { remaining, running: remaining > 0, start, stop };
}
