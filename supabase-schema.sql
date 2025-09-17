-- ==============================================
-- SUPABASE DATABASE SCHEMA
-- ==============================================
-- 이 파일은 Supabase 프로젝트의 전체 데이터베스 스키마를 정의합니다.
-- 실행 순서: 1. 테이블 생성 → 2. 함수 생성 → 3. 트리거 생성 → 4. 정책 설정
-- 
-- 사용자 역할: titan (기본), gaia (프리미엄), chaos (관리자)

-- ==============================================
-- 1. ENUMS & TYPES
-- ==============================================

-- 사용자 권한 열거형 (새로운 역할명)
CREATE TYPE user_role AS ENUM ('titan', 'gaia', 'chaos', 'hero');

-- 배 멤버 역할 열거형
CREATE TYPE ship_role AS ENUM ('captain', 'navigator', 'crew');

-- ==============================================
-- 2. TABLES
-- ==============================================

-- 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  role user_role DEFAULT 'titan' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 배 테이블
CREATE TABLE ships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  member_only BOOLEAN DEFAULT FALSE NOT NULL,
  member_approval_required BOOLEAN DEFAULT FALSE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 배 멤버 테이블
CREATE TABLE ship_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ship_id UUID REFERENCES ships(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role ship_role DEFAULT 'crew' NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL, -- 'active', 'pending', 'banned'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ship_id, user_id)
);

-- ==============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==============================================

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 프로필 조회 정책 (자신의 프로필만 조회 가능)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 프로필 수정 정책 (자신의 프로필만 수정 가능)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 프로필 삽입 정책 (자신의 프로필만 삽입 가능)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 사용자 계정 삭제 정책 (자신의 계정만 삭제 가능)
CREATE POLICY "Users can delete own account" ON auth.users
  FOR DELETE USING (auth.uid() = id);

-- ==============================================
-- 4. UTILITY FUNCTIONS
-- ==============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 사용자명 중복 체크 함수
CREATE OR REPLACE FUNCTION check_username_unique()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE username = NEW.username AND id != NEW.id) THEN
    RAISE EXCEPTION 'Username already exists';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 5. USER MANAGEMENT FUNCTIONS
-- ==============================================

-- 새 사용자 프로필 자동 생성 함수 (트리거용)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
BEGIN
  -- 고유한 사용자명 생성
  new_username := 'user_' || substr(NEW.id::text, 1, 8);
  
  -- 프로필 생성 시도
  BEGIN
    INSERT INTO profiles (id, username, display_name, role)
    VALUES (NEW.id, new_username, '', 'warrior');
  EXCEPTION
    WHEN OTHERS THEN
      -- 오류가 발생해도 사용자 생성은 계속 진행
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 클라이언트에서 프로필 생성 함수
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_username TEXT;
  display_name TEXT;
  username TEXT;
  new_profile profiles;
BEGIN
  -- 현재 사용자 ID와 일치하는지 확인
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only create profile for authenticated user';
  END IF;
  
  -- 기본 사용자명과 표시명 생성
  base_username := 'user_' || substr(user_id::text, 1, 8);
  display_name := split_part(user_email, '@', 1);
  
  -- UUID의 전체 해시를 사용하여 고유한 사용자명 생성
  username := base_username || '_' || substr(replace(user_id::text, '-', ''), 9, 8);
  
  -- 프로필 생성 시도
  INSERT INTO profiles (id, username, display_name, role)
  VALUES (user_id, username, display_name, 'warrior')
  RETURNING * INTO new_profile;
  
  -- 성공적으로 생성됨
  RETURN new_profile;
  
EXCEPTION
  WHEN unique_violation THEN
    -- 사용자명 충돌 시 타임스탬프 추가
    username := base_username || '_' || extract(epoch from now())::bigint;
    INSERT INTO profiles (id, username, display_name, role)
    VALUES (user_id, username, display_name, 'warrior')
    RETURNING * INTO new_profile;
    RETURN new_profile;
  WHEN OTHERS THEN
    -- 다른 오류 발생
    RAISE;
END;
$$;

-- 사용자 계정 삭제 함수
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
  
  -- 프로필 삭제
  DELETE FROM profiles WHERE id = user_id;
  
  -- 사용자 계정 삭제
  DELETE FROM auth.users WHERE id = user_id;
  
  -- 성공적으로 삭제됨
  RAISE NOTICE 'User account deleted successfully';
END;
$$;

-- ==============================================
-- 6. TRIGGERS
-- ==============================================

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 사용자명 중복 체크 트리거
CREATE TRIGGER check_username_unique_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_username_unique();

-- 새 사용자 등록 시 프로필 자동 생성 트리거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==============================================
-- 7. PERMISSIONS
-- ==============================================

-- 함수 실행 권한 설정
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;