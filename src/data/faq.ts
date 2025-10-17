export const faqData = {
  ko: {
    title: "자주 묻는 질문",
    items: [
      {
        question: "팀을 만들고 싶은데 어떻게 하나요?",
        answer: "팀은 로그인 후 홈 화면에서 만들 수 있어요.",
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
        question: "Any other inquiries?",
        answer:
          'Please contact us at <a href="mailto:public.park.ji@gmail.com" class="text-blue-600 hover:text-blue-800 underline">public.park.ji@gmail.com</a>.',
      },
    ],
  },
} as const;
