import { Metadata } from "next";
import NotFoundForm from "./NotFoundForm";

export const metadata: Metadata = {
  title:
    "페이지를 찾을 수 없습니다 - 예약시스템 | Page Not Found - Reservation System",
  description:
    "요청하신 페이지를 찾을 수 없습니다. The page you are looking for does not exist.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return <NotFoundForm />;
}
