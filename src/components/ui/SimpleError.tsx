import { cn } from "@/lib/utils";

interface SimpleErrorProps {
  message: string;
  className?: string;
}

export function SimpleError({ message, className }: SimpleErrorProps) {
  return (
    <div
      className={cn(
        "p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm",
        className
      )}
    >
      {message}
    </div>
  );
}

// 서버 컴포넌트용 간단한 에러 메시지
export function ServerError({ message, className }: SimpleErrorProps) {
  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center bg-background p-4",
        className
      )}
    >
      <div className="max-w-md w-full text-center">
        <div className="p-6 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">오류가 발생했습니다</h2>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}
