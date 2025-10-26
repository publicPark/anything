import { privacyData } from "@/data/legal/privacy";
import { getLocaleFromPathname } from "@/lib/i18n";

interface PrivacyPageProps {
  params: {
    locale: string;
  };
}

export default function PrivacyPage({ params }: PrivacyPageProps) {
  const locale = getLocaleFromPathname(`/${params.locale}`);
  const data =
    privacyData[locale as keyof typeof privacyData] || privacyData.ko;

  const sections = [
    "collection",
    "purpose",
    "retention",
    "cookies",
    "thirdParty",
    "rights",
    "security",
    "contact",
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm">
          <div className="p-6 sm:p-8">
            <header className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{data.title}</h1>
              <p className="text-muted-foreground text-sm">{data.updated}</p>
            </header>

            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-lg mb-8 leading-relaxed">{data.content}</p>

              {sections.map((section) => (
                <section key={section} className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">
                    {data.sections[section as keyof typeof data.sections].title}
                  </h2>
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {
                      data.sections[section as keyof typeof data.sections]
                        .content
                    }
                  </div>
                </section>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
