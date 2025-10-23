export const faqData = {
  ko: {
    title: "자주 묻는 질문",
    items: [
      {
        question: "팀을 만들고 싶은데 어떻게 하나요?",
        answer: "팀은 로그인 후 홈 화면에서 만들 수 있어요.",
      },
      {
        question: "슬랙 연동 하는 방법은?",
        answer:
          "팀 상세 페이지에서 '정비공' 이상의 멤버는 [메시지 설정] 탭을 클릭할 수 있어요. 여기서 'Slack Bot User OAuth Token'과 'Slack 채널 ID'를 입력하거나, 간단하게 'Slack Webhook URL'만 입력해도 연동이 가능해요. Bot Token을 사용하면 메시지 수정/삭제가 가능하지만, Webhook만 사용하면 등록 전용으로 제한돼요.",
      },
      {
        question: "그 밖에 다른 문의는?",
        answer:
          '이곳(<a href="mailto:public.park.ji@gmail.com" class="text-blue-600 hover:text-blue-800 underline">public.park.ji@gmail.com</a>)에 문의를 남겨주세요.',
      },
    ],
  },
  en: {
    title: "FAQ",
    items: [
      {
        question: "How can I create a team?",
        answer: "You can create a team after logging in to the home screen.",
      },
      {
        question: "How do I integrate with Slack?",
        answer:
          "Members with 'Mechanic' level or higher can click the [Message Settings] tab on the Team Details Page. Here you can enter 'Slack Bot User OAuth Token' and 'Slack Channel ID', or simply enter a 'Slack Webhook URL' for integration. Using Bot Token allows message editing/deletion, while Webhook only allows posting.",
      },
      {
        question: "Any other inquiries?",
        answer:
          'Please contact us at <a href="mailto:public.park.ji@gmail.com" class="text-blue-600 hover:text-blue-800 underline">public.park.ji@gmail.com</a>.',
      },
    ],
  },
} as const;
