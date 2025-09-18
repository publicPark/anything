-- ==============================================
-- SUPABASE DATABASE SCHEMA
-- ==============================================
-- 이 파일은 Supabase 프로젝트의 전체 데이터베스 스키마를 정의합니다.
-- 실행 순서: 1. 테이블 생성 → 2. 함수 생성 → 3. 트리거 생성 → 4. 정책 설정
-- 
-- 사용자 역할: titan (기본), gaia (프리미엄), chaos (관리자)
-- 배 멤버 역할: captain (선장), navigator (항해사), crew (선원)

-- ==============================================
-- 1. ENUMS & TYPES
-- ==============================================

-- 사용자 권한 열거형
CREATE TYPE user_role AS ENUM ('titan', 'gaia', 'chaos');

-- 배 멤버 역할 열거형
CREATE TYPE ship_member_role AS ENUM ('captain', 'navigator', 'crew');

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
  public_id TEXT UNIQUE NOT NULL,
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
  role ship_member_role DEFAULT 'crew' NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ship_id, user_id)
);

-- ==============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==============================================

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ship_members ENABLE ROW LEVEL SECURITY;

-- 프로필 조회 정책
-- 1. 자신의 프로필 조회 가능
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. 배 멤버의 프로필 조회 가능 (배 멤버 정보 표시용)
CREATE POLICY "Anyone can view ship member profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ship_members
      WHERE user_id = profiles.id
    )
  );

-- 프로필 수정 정책 (자신의 프로필만 수정 가능)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 프로필 삽입 정책 (자신의 프로필만 삽입 가능)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- 배 관련 정책들
-- 1. 모든 사용자는 배를 조회할 수 있음
CREATE POLICY "Anyone can view ships" ON ships
  FOR SELECT USING (true);

-- 2. gaia 등급 이상의 사용자만 배를 생성할 수 있음
CREATE POLICY "Gaia+ users can create ships" ON ships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('gaia', 'chaos')
    )
  );

-- 3. 배 생성자만 배를 수정/삭제할 수 있음
CREATE POLICY "Ship creators can update ships" ON ships
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Ship creators can delete ships" ON ships
  FOR DELETE USING (created_by = auth.uid());

-- 배 멤버 관련 정책들
-- 1. 모든 사용자는 배 멤버를 조회할 수 있음
CREATE POLICY "Anyone can view ship members" ON ship_members
  FOR SELECT USING (true);

-- 2. 모든 사용자는 배에 가입할 수 있음
CREATE POLICY "Anyone can join ships" ON ship_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. 선장과 항해사는 멤버를 관리할 수 있음
CREATE POLICY "Captains and navigators can manage members" ON ship_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM ship_members sm
      WHERE sm.ship_id = ship_members.ship_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('captain', 'navigator')
    )
  );

-- 4. 선장만 멤버를 삭제할 수 있음
CREATE POLICY "Captains can remove members" ON ship_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ship_members sm
      WHERE sm.ship_id = ship_members.ship_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'captain'
    )
  );

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
  -- 고유한 사용자명 생성 (user_ + 사용자 ID 8자리)
  new_username := 'user_' || substr(NEW.id::text, 1, 8);
  
  -- 프로필 생성 시도
  BEGIN
    INSERT INTO profiles (id, username, display_name, role)
    VALUES (NEW.id, new_username, '', 'titan');
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
  display_name TEXT;
  username TEXT;
  new_profile profiles;
BEGIN
  -- 현재 사용자 ID와 일치하는지 확인
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only create profile for authenticated user';
  END IF;
  
  -- 기본 사용자명과 표시명 생성
  username := 'user_' || substr(user_id::text, 1, 8);
  display_name := split_part(user_email, '@', 1);
  
  -- 프로필 생성 시도
  INSERT INTO profiles (id, username, display_name, role)
  VALUES (user_id, username, display_name, 'titan')
  RETURNING * INTO new_profile;
  
  RETURN new_profile;
  
EXCEPTION
  WHEN unique_violation THEN
    -- 사용자명 충돌 시 타임스탬프 추가
    username := 'user_' || substr(user_id::text, 1, 8) || '_' || extract(epoch from now())::bigint;
    INSERT INTO profiles (id, username, display_name, role)
    VALUES (user_id, username, display_name, 'titan')
    RETURNING * INTO new_profile;
    RETURN new_profile;
  WHEN OTHERS THEN
    RAISE;
END;
$$;


-- 배 생성 함수
CREATE OR REPLACE FUNCTION create_ship(
  ship_name TEXT,
  ship_description TEXT DEFAULT NULL,
  is_member_only BOOLEAN DEFAULT FALSE,
  requires_approval BOOLEAN DEFAULT FALSE
)
RETURNS ships
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  user_role user_role;
  new_ship ships;
BEGIN
  -- 현재 사용자 ID 가져오기
  user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 사용자 권한 확인 (gaia 이상)
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  IF user_role NOT IN ('gaia', 'chaos') THEN
    RAISE EXCEPTION 'Insufficient permissions: Gaia+ role required';
  END IF;
  
  -- 배 생성
  INSERT INTO ships (name, description, member_only, member_approval_required, created_by)
  VALUES (ship_name, ship_description, is_member_only, requires_approval, user_id)
  RETURNING * INTO new_ship;
  
  -- 배 생성자를 선장으로 자동 가입
  INSERT INTO ship_members (ship_id, user_id, role)
  VALUES (new_ship.id, user_id, 'captain');
  
  RETURN new_ship;
END;
$$;

-- 배 가입 함수
CREATE OR REPLACE FUNCTION join_ship(ship_uuid UUID)
RETURNS ship_members
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  ship_record ships;
  new_member ship_members;
BEGIN
  -- 현재 사용자 ID 가져오기
  user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 배 정보 조회
  SELECT * INTO ship_record FROM ships WHERE id = ship_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ship not found';
  END IF;
  
  -- 이미 가입되어 있는지 확인
  IF EXISTS (SELECT 1 FROM ship_members WHERE ship_id = ship_uuid AND user_id = user_id) THEN
    RAISE EXCEPTION 'Already a member of this ship';
  END IF;
  
  -- 배 가입
  INSERT INTO ship_members (ship_id, user_id, role)
  VALUES (ship_uuid, user_id, 'crew')
  RETURNING * INTO new_member;
  
  RETURN new_member;
END;
$$;

-- 배 멤버 역할 변경 함수
CREATE OR REPLACE FUNCTION change_member_role(
  member_uuid UUID,
  new_role ship_member_role
)
RETURNS ship_members
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  member_record ship_members;
  updated_member ship_members;
BEGIN
  -- 현재 사용자 ID 가져오기
  user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 멤버 정보 조회
  SELECT * INTO member_record FROM ship_members WHERE id = member_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;
  
  -- 권한 확인 (선장 또는 항해사)
  IF NOT EXISTS (
    SELECT 1 FROM ship_members 
    WHERE ship_id = member_record.ship_id 
    AND user_id = user_id 
    AND role IN ('captain', 'navigator')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- 역할 변경
  UPDATE ship_members 
  SET role = new_role 
  WHERE id = member_uuid
  RETURNING * INTO updated_member;
  
  RETURN updated_member;
END;
$$;

-- 선장 양도 함수
CREATE OR REPLACE FUNCTION transfer_captaincy(
  new_captain_member_uuid UUID
)
RETURNS ship_members
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  new_captain_record ship_members;
  current_captain_record ship_members;
  updated_member ship_members;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 새 선장이 될 멤버 정보 조회
  SELECT * INTO new_captain_record FROM ship_members WHERE id = new_captain_member_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;
  
  -- 새 선장이 항해사인지 확인
  IF new_captain_record.role != 'navigator' THEN
    RAISE EXCEPTION 'Only navigators can be promoted to captain';
  END IF;
  
  -- 현재 사용자가 선장인지 확인
  SELECT * INTO current_captain_record 
  FROM ship_members 
  WHERE ship_id = new_captain_record.ship_id 
  AND user_id = current_user_id 
  AND role = 'captain';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only the current captain can transfer captaincy';
  END IF;
  
  -- 트랜잭션으로 역할 변경
  BEGIN
    -- 새 선장을 선장으로 승격
    UPDATE ship_members 
    SET role = 'captain' 
    WHERE id = new_captain_member_uuid
    RETURNING * INTO updated_member;
    
    -- 현재 선장을 항해사로 변경
    UPDATE ship_members 
    SET role = 'navigator' 
    WHERE id = current_captain_record.id;
    
    RETURN updated_member;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to transfer captaincy: %', SQLERRM;
  END;
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

CREATE TRIGGER update_ships_updated_at
  BEFORE UPDATE ON ships
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
GRANT EXECUTE ON FUNCTION create_ship(TEXT, TEXT, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION join_ship(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION change_member_role(UUID, ship_member_role) TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_captaincy(UUID) TO authenticated;