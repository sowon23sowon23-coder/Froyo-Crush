# FROYO CRUSH — Yogurtland brand game prototype

매치3 브랜드 게임 시안. 브라우저에서 바로 실행되는 정적 프로토타입입니다.

## 실행

`index.html`을 브라우저로 열면 끝입니다. 빌드나 설치 과정 없음.

로컬 서버로 띄우고 싶다면:

```
cd C:\YL\Froyo-Crush
python -m http.server 5173
```

브라우저에서 `http://localhost:5173`

## 구조

```
Froyo-Crush/
├─ index.html          화면 10종 마크업
├─ assets/
│  ├─ styles.css       디자인 토큰 + 화면별 스타일 + 연출 애니메이션
│  └─ game.js          매치3 로직, 부스터, 레벨 맵 생성, 라우터
└─ README.md
```

`game.js` 주요 블록

| 블록 | 하는 일 |
|---|---|
| screen router | 상단 칩 / `data-go` 속성으로 화면 전환 |
| swirlPoint / buildMap | 스월 경로 좌표 계산 후 레벨 노드 배치 |
| feedback helpers | 수집 애니메이션, 충격파, 배너, 플래시, 햅틱, 점수 롤업 |
| match-3 | 보드 생성, 스왑, 매치 판정, 낙하/리필, 콤보 |
| boosters | 셔플 / 폭탄 / 스푼 |

## 조정 포인트

| 값 | 위치 | 기본값 |
|---|---|---|
| 보드 크기 | `game.js` `const C=8, R=8` | 8×8 |
| 목표 개수 | `startLevel()` `goal` | 딸기 15개 |
| 이동 횟수 | `startLevel()` `moves` | 18 |
| 별 3개 기준 점수 | `const TARGET` | 6000 |
| 토핑 종류·색 | `const TYPES` | 6종 |
| 브랜드 컬러 | `styles.css` `:root` | Yogurtland Magenta |

## 아직 안 들어간 것

- 특수 타일 (4매치 → 줄 삭제, 5매치 → 프로요 폭탄). 현재는 점수 보너스만 있음
- 서버 연동 (세션 ID, 쿠폰 발급/사용 처리). 쿠폰 코드는 하드코딩
- 어드민 화면
