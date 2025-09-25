"use client";

import { useI18n } from "@/hooks/useI18n";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface ShipTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function ShipTabs({ tabs, activeTab, onTabChange }: ShipTabsProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="tab-content">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
