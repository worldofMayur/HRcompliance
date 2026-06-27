import { REPORT_CARDS, ReportType } from "../data/reportConfig";

interface Props {
  selectedReport: ReportType | "";
  onSelect: (report: ReportType) => void;
}

export default function ReportCards({
  selectedReport,
  onSelect,
}: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {REPORT_CARDS.map((card) => (
        <button
          key={card.id}
          onClick={() => onSelect(card.id)}
          className={`
            w-full rounded-xl border p-5 text-left
            transition-all duration-300
            hover:-translate-y-1 hover:shadow-lg
            ${
              selectedReport === card.id
                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
            }
          `}
        >

          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {card.title}
          </h3>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {card.description}
          </p>
        </button>
      ))}
    </div>
  );
}