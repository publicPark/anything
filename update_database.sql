-- 데이터베이스 업데이트 SQL
-- ships 테이블에서 slack_webhook_url 컬럼 제거
ALTER TABLE ships DROP COLUMN IF EXISTS slack_webhook_url;

-- ship_notifications 테이블이 이미 존재하는지 확인하고 생성
CREATE TABLE IF NOT EXISTS ship_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ship_id UUID REFERENCES ships(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL, -- 'slack', 'discord' 등
  enabled BOOLEAN DEFAULT TRUE NOT NULL,
  webhook_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ship_id, channel)
);

-- RLS 활성화
ALTER TABLE ship_notifications ENABLE ROW LEVEL SECURITY;

-- RLS 정책 추가 (기존 정책 삭제 후 생성)
DROP POLICY IF EXISTS "Anyone can view ship notifications" ON ship_notifications;
CREATE POLICY "Anyone can view ship notifications" ON ship_notifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Mechanics+ can create ship notifications" ON ship_notifications;
CREATE POLICY "Mechanics+ can create ship notifications" ON ship_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ship_members sm
      WHERE sm.ship_id = ship_notifications.ship_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('captain', 'mechanic')
    )
  );

DROP POLICY IF EXISTS "Mechanics+ can update ship notifications" ON ship_notifications;
CREATE POLICY "Mechanics+ can update ship notifications" ON ship_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM ship_members sm
      WHERE sm.ship_id = ship_notifications.ship_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('captain', 'mechanic')
    )
  );

DROP POLICY IF EXISTS "Mechanics+ can delete ship notifications" ON ship_notifications;
CREATE POLICY "Mechanics+ can delete ship notifications" ON ship_notifications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ship_members sm
      WHERE sm.ship_id = ship_notifications.ship_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('captain', 'mechanic')
    )
  );

-- updated_at 트리거 추가
DROP TRIGGER IF EXISTS update_ship_notifications_updated_at ON ship_notifications;
CREATE TRIGGER update_ship_notifications_updated_at
  BEFORE UPDATE ON ship_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
