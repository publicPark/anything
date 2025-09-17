-- 사용자 계정 삭제 함수
-- 이 함수를 Supabase SQL Editor에서 실행하세요

CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- 현재 사용자 ID 가져오기
  user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 프로필 삭제 (CASCADE로 자동 삭제되지만 명시적으로 삭제)
  DELETE FROM profiles WHERE id = user_id;
  
  -- 사용자 계정 삭제 (auth.users 테이블에서)
  -- 주의: 이 함수는 RLS 정책에 의해 보호됩니다
  DELETE FROM auth.users WHERE id = user_id;
  
  -- 성공적으로 삭제됨
  RAISE NOTICE 'User account deleted successfully';
END;
$$;

-- 함수 실행 권한 설정
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

-- RLS 정책 추가 (자신의 계정만 삭제 가능)
CREATE POLICY "Users can delete own account" ON auth.users
  FOR DELETE USING (auth.uid() = id);

-- 프로필 자동 생성 함수 (빈 display_name으로 시작)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
BEGIN
  -- 고유한 사용자명 생성
  new_username := 'user_' || substr(NEW.id::text, 1, 8);
  
  -- 프로필 생성 시도 (display_name은 빈 문자열)
  BEGIN
    INSERT INTO profiles (id, username, display_name)
    VALUES (NEW.id, new_username, '');
  EXCEPTION
    WHEN OTHERS THEN
      -- 오류가 발생해도 사용자 생성은 계속 진행
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 사용자 등록 시 프로필 자동 생성 트리거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
