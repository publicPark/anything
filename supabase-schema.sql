-- ==============================================
-- SUPABASE DATABASE SCHEMA
-- ==============================================
-- 이 파일은 Supabase 프로젝트의 전체 데이터베스 스키마를 정의합니다.
-- 실행 순서: 1. 테이블 생성 → 2. 함수 생성 → 3. 트리거 생성 → 4. 정책 설정
-- 
-- 사용자 역할: titan (기본), gaia (프리미엄), chaos (관리자)
-- 배 멤버 역할: captain (선장), mechanic (정비사), crew (선원)

-- ==============================================
-- 1. ENUMS & TYPES
-- ==============================================

-- 사용자 권한 열거형
CREATE TYPE user_role AS ENUM ('titan', 'gaia', 'chaos');

-- 배 멤버 역할 열거형
CREATE TYPE ship_member_role AS ENUM ('captain', 'mechanic', 'crew');

-- 멤버 승인 요청 상태 열거형
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

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

-- 배 멤버 승인 요청 테이블
CREATE TABLE ship_member_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ship_id UUID REFERENCES ships(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status approval_status DEFAULT 'pending' NOT NULL,
  message TEXT, -- 가입 신청 메시지
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_message TEXT, -- 승인/거부 메시지
  UNIQUE(ship_id, user_id)
);

-- 배 객실 테이블
CREATE TABLE ship_cabins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ship_id UUID REFERENCES ships(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==============================================

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ship_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ship_member_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ship_cabins ENABLE ROW LEVEL SECURITY;

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

-- 3. 배 생성자, captain, mechanic만 배를 수정할 수 있음
DROP POLICY IF EXISTS "Ship creators can update ships" ON ships;
CREATE POLICY "Ship creators and managers can update ships" ON ships
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM ship_members 
      WHERE ship_id = ships.id 
      AND user_id = auth.uid() 
      AND role IN ('captain', 'mechanic')
    )
  );

DROP POLICY IF EXISTS "Ship creators can delete ships" ON ships;
CREATE POLICY "Ship creators and captains can delete ships" ON ships
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM ship_members 
      WHERE ship_id = ships.id 
      AND user_id = auth.uid() 
      AND role = 'captain'
    )
  );

-- 배 멤버 관련 정책들
-- 1. 모든 사용자는 배 멤버를 조회할 수 있음
CREATE POLICY "Anyone can view ship members" ON ship_members
  FOR SELECT USING (true);

-- 2. 모든 사용자는 배에 가입할 수 있음
CREATE POLICY "Anyone can join ships" ON ship_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. 선장과 mechanic은 멤버를 관리할 수 있음
CREATE POLICY "Captains and mechanics can manage members" ON ship_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM ship_members sm
      WHERE sm.ship_id = ship_members.ship_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('captain', 'mechanic')
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

-- 배 멤버 승인 요청 관련 정책들
-- 1. 모든 사용자는 승인 요청을 조회할 수 있음 (자신의 요청 또는 배 관리자)
CREATE POLICY "Users can view member requests" ON ship_member_requests
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM ship_members sm
      WHERE sm.ship_id = ship_member_requests.ship_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('captain', 'mechanic')
    )
  );

-- 2. 모든 사용자는 승인 요청을 생성할 수 있음
CREATE POLICY "Users can create member requests" ON ship_member_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. 선장과 mechanic은 승인 요청을 수정할 수 있음 (승인/거부)
CREATE POLICY "Captains and mechanics can update member requests" ON ship_member_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM ship_members sm
      WHERE sm.ship_id = ship_member_requests.ship_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('captain', 'mechanic')
    )
  );

-- 4. 선장과 mechanic은 승인 요청을 삭제할 수 있음
CREATE POLICY "Captains and mechanics can delete member requests" ON ship_member_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ship_members sm
      WHERE sm.ship_id = ship_member_requests.ship_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('captain', 'mechanic')
    )
  );

-- 배 객실 관련 정책들
-- 1. 모든 사용자는 객실을 조회할 수 있음
CREATE POLICY "Anyone can view ship cabins" ON ship_cabins
  FOR SELECT USING (true);

-- 2. mechanic 이상의 사용자만 객실을 생성할 수 있음
CREATE POLICY "Mechanics+ can create ship cabins" ON ship_cabins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ship_members sm
      WHERE sm.ship_id = ship_cabins.ship_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('captain', 'mechanic')
    )
  );

-- 3. mechanic 이상의 사용자만 객실을 수정할 수 있음
CREATE POLICY "Mechanics+ can update ship cabins" ON ship_cabins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM ship_members sm
      WHERE sm.ship_id = ship_cabins.ship_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('captain', 'mechanic')
    )
  );

-- 4. mechanic 이상의 사용자만 객실을 삭제할 수 있음
CREATE POLICY "Mechanics+ can delete ship cabins" ON ship_cabins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ship_members sm
      WHERE sm.ship_id = ship_cabins.ship_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('captain', 'mechanic')
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
  IF current_user_id IS NULL THEN
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

-- 배 가입 함수 (승인 필요 여부에 따라 다르게 처리)
CREATE OR REPLACE FUNCTION join_ship(ship_uuid UUID, request_message TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  ship_record ships;
  new_member ship_members;
  new_request ship_member_requests;
  result JSON;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 배 정보 조회
  SELECT * INTO ship_record FROM ships WHERE id = ship_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ship not found';
  END IF;
  
  -- 이미 가입되어 있는지 확인
  IF EXISTS (SELECT 1 FROM ship_members sm WHERE sm.ship_id = ship_uuid AND sm.user_id = current_user_id) THEN
    RAISE EXCEPTION 'Already a member of this ship';
  END IF;
  
  -- 이미 승인 요청이 있는지 확인
  IF EXISTS (SELECT 1 FROM ship_member_requests smr WHERE smr.ship_id = ship_uuid AND smr.user_id = current_user_id AND smr.status = 'pending') THEN
    RAISE EXCEPTION 'Already requested to join this ship';
  END IF;
  
  -- 승인이 필요한 경우
  IF ship_record.member_approval_required THEN
    -- 승인 요청 생성
    INSERT INTO ship_member_requests (ship_id, user_id, message)
    VALUES (ship_uuid, current_user_id, request_message)
    RETURNING * INTO new_request;
    
    result := json_build_object(
      'type', 'request',
      'request', row_to_json(new_request)
    );
  ELSE
    -- 즉시 가입
    INSERT INTO ship_members (ship_id, user_id, role)
    VALUES (ship_uuid, current_user_id, 'crew')
    RETURNING * INTO new_member;
    
    result := json_build_object(
      'type', 'member',
      'member', row_to_json(new_member)
    );
  END IF;
  
  RETURN result;
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
  current_user_id UUID;
  member_record ship_members;
  updated_member ship_members;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 멤버 정보 조회
  SELECT * INTO member_record FROM ship_members WHERE id = member_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;
  
  -- 권한 확인
  -- 1. 선장은 모든 멤버의 역할을 변경할 수 있음
  -- 2. mechanic은 crew를 mechanic으로 승격하거나, 자신을 crew로 강등할 수 있음
  IF NOT EXISTS (
    SELECT 1 FROM ship_members sm
    WHERE sm.ship_id = member_record.ship_id
    AND sm.user_id = current_user_id
    AND (
      sm.role = 'captain' OR  -- 선장은 모든 권한
      (sm.role = 'mechanic' AND (
        (member_record.role = 'crew' AND new_role = 'mechanic') OR  -- crew를 mechanic으로 승격
        (member_record.user_id = current_user_id AND member_record.role = 'mechanic' AND new_role = 'crew')  -- 자신을 crew로 강등
      ))
    )
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

-- 승인 요청 승인 함수
CREATE OR REPLACE FUNCTION approve_member_request(
  request_uuid UUID,
  review_msg TEXT DEFAULT NULL
)
RETURNS ship_members
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  request_record ship_member_requests;
  new_member ship_members;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 승인 요청 정보 조회
  SELECT * INTO request_record FROM ship_member_requests WHERE id = request_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  
  -- 승인 요청이 대기 중인지 확인
  IF request_record.status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;
  
  -- 권한 확인 (선장 또는 항해사)
  IF NOT EXISTS (
    SELECT 1 FROM ship_members sm
    WHERE sm.ship_id = request_record.ship_id 
    AND sm.user_id = current_user_id 
    AND sm.role IN ('captain', 'mechanic')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- 트랜잭션으로 승인 처리
  BEGIN
    -- 승인 요청 상태 업데이트
    UPDATE ship_member_requests 
    SET status = 'approved', 
        reviewed_at = NOW(), 
        reviewed_by = current_user_id,
        review_message = review_msg
    WHERE id = request_uuid;
    
    -- 멤버로 추가
    INSERT INTO ship_members (ship_id, user_id, role)
    VALUES (request_record.ship_id, request_record.user_id, 'crew')
    RETURNING * INTO new_member;
    
    RETURN new_member;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to approve request: %', SQLERRM;
  END;
END;
$$;

-- 승인 요청 거부 함수
CREATE OR REPLACE FUNCTION reject_member_request(
  request_uuid UUID,
  review_msg TEXT DEFAULT NULL
)
RETURNS ship_member_requests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  request_record ship_member_requests;
  updated_request ship_member_requests;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 승인 요청 정보 조회
  SELECT * INTO request_record FROM ship_member_requests WHERE id = request_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  
  -- 승인 요청이 대기 중인지 확인
  IF request_record.status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;
  
  -- 권한 확인 (선장 또는 항해사)
  IF NOT EXISTS (
    SELECT 1 FROM ship_members sm
    WHERE sm.ship_id = request_record.ship_id 
    AND sm.user_id = current_user_id 
    AND sm.role IN ('captain', 'mechanic')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- 승인 요청 상태 업데이트
  UPDATE ship_member_requests 
  SET status = 'rejected', 
      reviewed_at = NOW(), 
      reviewed_by = current_user_id,
      review_message = review_msg
  WHERE id = request_uuid
  RETURNING * INTO updated_request;
  
  RETURN updated_request;
END;
$$;

-- 거부된 요청을 대기 상태로 되돌리는 함수 (재검토용)
CREATE OR REPLACE FUNCTION reset_rejected_request_to_pending(
  request_uuid UUID,
  review_msg TEXT DEFAULT NULL
)
RETURNS ship_member_requests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  request_record ship_member_requests;
  updated_request ship_member_requests;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 승인 요청 정보 조회
  SELECT * INTO request_record FROM ship_member_requests WHERE id = request_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  
  -- 승인 요청이 거부된 상태인지 확인
  IF request_record.status != 'rejected' THEN
    RAISE EXCEPTION 'Request is not rejected';
  END IF;
  
  -- 권한 확인 (선장 또는 항해사)
  IF NOT EXISTS (
    SELECT 1 FROM ship_members sm
    WHERE sm.ship_id = request_record.ship_id 
    AND sm.user_id = current_user_id 
    AND sm.role IN ('captain', 'mechanic')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- 거부된 요청을 대기 상태로 되돌리기
  UPDATE ship_member_requests 
  SET status = 'pending', 
      reviewed_at = NULL,
      reviewed_by = NULL,
      review_message = review_msg
  WHERE id = request_uuid
  RETURNING * INTO updated_request;
  
  RETURN updated_request;
END;
$$;

-- 거부된 요청 삭제 함수
CREATE OR REPLACE FUNCTION delete_rejected_request(
  request_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  request_record ship_member_requests;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 승인 요청 정보 조회
  SELECT * INTO request_record FROM ship_member_requests WHERE id = request_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  
  -- 승인 요청이 거부된 상태인지 확인
  IF request_record.status != 'rejected' THEN
    RAISE EXCEPTION 'Request is not rejected';
  END IF;
  
  -- 권한 확인 (선장 또는 항해사)
  IF NOT EXISTS (
    SELECT 1 FROM ship_members sm
    WHERE sm.ship_id = request_record.ship_id 
    AND sm.user_id = current_user_id 
    AND sm.role IN ('captain', 'mechanic')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- 거부된 요청 삭제
  DELETE FROM ship_member_requests WHERE id = request_uuid;
  
  RETURN TRUE;
END;
$$;

-- 거부된 요청 조회 함수
CREATE OR REPLACE FUNCTION get_rejected_requests(
  ship_uuid UUID
)
RETURNS TABLE (
  id UUID,
  ship_id UUID,
  user_id UUID,
  status approval_status,
  message TEXT,
  requested_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  review_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 권한 확인 (선장 또는 항해사)
  IF NOT EXISTS (
    SELECT 1 FROM ship_members sm
    WHERE sm.ship_id = ship_uuid 
    AND sm.user_id = current_user_id 
    AND sm.role IN ('captain', 'mechanic')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- 거부된 요청들 반환
  RETURN QUERY
  SELECT 
    smr.id,
    smr.ship_id,
    smr.user_id,
    smr.status,
    smr.message,
    smr.requested_at,
    smr.reviewed_at,
    smr.reviewed_by,
    smr.review_message
  FROM ship_member_requests smr
  WHERE smr.ship_id = ship_uuid 
  AND smr.status = 'rejected'
  ORDER BY smr.reviewed_at DESC;
END;
$$;

-- 객실 생성 함수
CREATE OR REPLACE FUNCTION create_ship_cabin(
  ship_uuid UUID,
  cabin_name TEXT,
  cabin_description TEXT DEFAULT NULL
)
RETURNS ship_cabins
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  new_cabin ship_cabins;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 권한 확인 (mechanic 이상)
  IF NOT EXISTS (
    SELECT 1 FROM ship_members sm
    WHERE sm.ship_id = ship_uuid 
    AND sm.user_id = current_user_id 
    AND sm.role IN ('captain', 'mechanic')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions: Mechanic+ role required';
  END IF;
  
  -- 객실 생성
  INSERT INTO ship_cabins (ship_id, name, description, created_by)
  VALUES (ship_uuid, cabin_name, cabin_description, current_user_id)
  RETURNING * INTO new_cabin;
  
  RETURN new_cabin;
END;
$$;

-- 객실 수정 함수
CREATE OR REPLACE FUNCTION update_ship_cabin(
  cabin_uuid UUID,
  cabin_name TEXT,
  cabin_description TEXT DEFAULT NULL
)
RETURNS ship_cabins
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  cabin_record ship_cabins;
  updated_cabin ship_cabins;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 객실 정보 조회
  SELECT * INTO cabin_record FROM ship_cabins WHERE id = cabin_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cabin not found';
  END IF;
  
  -- 권한 확인 (mechanic 이상)
  IF NOT EXISTS (
    SELECT 1 FROM ship_members sm
    WHERE sm.ship_id = cabin_record.ship_id 
    AND sm.user_id = current_user_id 
    AND sm.role IN ('captain', 'mechanic')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions: Mechanic+ role required';
  END IF;
  
  -- 객실 수정
  UPDATE ship_cabins 
  SET name = cabin_name, 
      description = cabin_description
  WHERE id = cabin_uuid
  RETURNING * INTO updated_cabin;
  
  RETURN updated_cabin;
END;
$$;

-- 객실 삭제 함수
CREATE OR REPLACE FUNCTION delete_ship_cabin(
  cabin_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  cabin_record ship_cabins;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  -- 사용자가 로그인되어 있는지 확인
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 객실 정보 조회
  SELECT * INTO cabin_record FROM ship_cabins WHERE id = cabin_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cabin not found';
  END IF;
  
  -- 권한 확인 (mechanic 이상)
  IF NOT EXISTS (
    SELECT 1 FROM ship_members sm
    WHERE sm.ship_id = cabin_record.ship_id 
    AND sm.user_id = current_user_id 
    AND sm.role IN ('captain', 'mechanic')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions: Mechanic+ role required';
  END IF;
  
  -- 객실 삭제
  DELETE FROM ship_cabins WHERE id = cabin_uuid;
  
  RETURN TRUE;
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
  
  -- 새 선장이 mechanic인지 확인
  IF new_captain_record.role != 'mechanic' THEN
    RAISE EXCEPTION 'Only mechanics can be promoted to captain';
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
    
    -- 현재 선장을 mechanic으로 변경
    UPDATE ship_members
    SET role = 'mechanic'
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

CREATE TRIGGER update_ship_cabins_updated_at
  BEFORE UPDATE ON ship_cabins
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
GRANT EXECUTE ON FUNCTION join_ship(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION change_member_role(UUID, ship_member_role) TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_captaincy(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_member_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_member_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_ship_cabin(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_ship_cabin(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_ship_cabin(UUID) TO authenticated;