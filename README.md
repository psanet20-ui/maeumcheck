# 마음체크

`마음체크`는 우울, 불안, 스트레스를 가볍게 자가점검하고 생활 회복 가이드를 살펴볼 수 있는 앱입니다.

## 실행

```bash
npm install
npm run dev
```

기본 개발 서버는 Vite를 사용합니다.

## 카카오 공유 설정

카카오톡 공유는 Kakao JavaScript SDK를 사용합니다.

1. `.env.example`을 참고해 `.env.local` 파일을 만듭니다.
2. `VITE_KAKAO_JAVASCRIPT_KEY`에 카카오 JavaScript 키를 넣습니다.
3. 배포 주소가 있다면 `VITE_APP_SHARE_URL`도 함께 넣습니다.

예시:

```bash
VITE_KAKAO_JAVASCRIPT_KEY=발급받은_자바스크립트_키
VITE_APP_SHARE_URL=https://your-domain.example.com
```

키가 없으면 앱은 계속 실행되며, 카카오 버튼만 비활성화되고 일반 공유와 클립보드 복사는 그대로 동작합니다.

## 현재 포함 기능

- PHQ-9 참고 우울 자가점검
- GAD-7 참고 불안 자가점검
- 생활 스트레스 자가점검
- 검사 결과 기반 회복 가이드 추천
- 수면 회복, 불안 진정, 무기력 회복, 관계 피로 회복, 번아웃 회복 가이드
- 마음 날씨 선택
- 감정 기록과 한 줄 메모
- 위로 카드 순환
- 카카오 공유 / 일반 공유
- 로컬 기록 저장

## 디자인 참고

- 비주얼 스타일 가이드: [docs/visual-style-guide.md](C:/Users/user/Documents/ABB1PRO/docs/visual-style-guide.md)

## 배포 참고

- 개인정보처리방침 정적 페이지: [public/privacy-policy.html](/C:/마음체크/public/privacy-policy.html)
- 플레이스토어 문구 초안: [docs/playstore-copy.md](/C:/마음체크/docs/playstore-copy.md)
