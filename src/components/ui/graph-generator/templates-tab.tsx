import { CardButton } from "../card-button";
import {
  generatePath,
  generateCycle,
  generateComplete,
  generateStar,
  generateWeighted,
  generateRandomWeightedGraph,
  type GeneratedGraph,
} from "../../../utils/graph/graphGenerator";

interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  generate: () => GeneratedGraph;
}

interface TemplatesTabProps {
  onGenerate: (result: GeneratedGraph) => void;
}

const templates: TemplateConfig[] = [
  {
    id: "path",
    name: "Path",
    description: "Linear chain",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
        <circle cx="4" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="20" cy="12" r="2" />
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="14" y1="12" x2="18" y2="12" />
      </svg>
    ),
    generate: () => generatePath(5),
  },
  {
    id: "cycle",
    name: "Cycle",
    description: "Circular loop",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
        <circle cx="12" cy="4" r="2" />
        <circle cx="19" cy="9" r="2" />
        <circle cx="19" cy="17" r="2" />
        <circle cx="12" cy="21" r="2" />
        <circle cx="5" cy="17" r="2" />
        <circle cx="5" cy="9" r="2" />
        <line x1="13.7" y1="5.3" x2="17.3" y2="7.7" />
        <line x1="19" y1="11" x2="19" y2="15" />
        <line x1="17.3" y1="18.3" x2="13.7" y2="19.7" />
        <line x1="10.3" y1="19.7" x2="6.7" y2="18.3" />
        <line x1="5" y1="15" x2="5" y2="11" />
        <line x1="6.7" y1="7.7" x2="10.3" y2="5.3" />
      </svg>
    ),
    generate: () => generateCycle(6),
  },
  {
    id: "complete",
    name: "Complete",
    description: "Fully connected",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
        <circle cx="12" cy="4" r="2" />
        <circle cx="4" cy="12" r="2" />
        <circle cx="20" cy="12" r="2" />
        <circle cx="8" cy="20" r="2" />
        <circle cx="16" cy="20" r="2" />
        <line x1="12" y1="6" x2="4" y2="10" />
        <line x1="12" y1="6" x2="20" y2="10" />
        <line x1="12" y1="6" x2="8" y2="18" />
        <line x1="12" y1="6" x2="16" y2="18" />
        <line x1="6" y1="12" x2="18" y2="12" />
        <line x1="4" y1="14" x2="8" y2="18" />
        <line x1="20" y1="14" x2="16" y2="18" />
        <line x1="10" y1="20" x2="14" y2="20" />
        <line x1="4" y1="14" x2="16" y2="18" />
        <line x1="20" y1="14" x2="8" y2="18" />
      </svg>
    ),
    generate: () => generateComplete(5),
  },
  {
    id: "star",
    name: "Star",
    description: "Central hub",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
        <circle cx="12" cy="12" r="2.5" />
        <circle cx="12" cy="3" r="2" />
        <circle cx="20" cy="9" r="2" />
        <circle cx="17" cy="20" r="2" />
        <circle cx="7" cy="20" r="2" />
        <circle cx="4" cy="9" r="2" />
        <line x1="12" y1="9.5" x2="12" y2="5" />
        <line x1="14.2" y1="10.5" x2="18" y2="9" />
        <line x1="13.5" y1="14" x2="15.5" y2="18.5" />
        <line x1="10.5" y1="14" x2="8.5" y2="18.5" />
        <line x1="9.8" y1="10.5" x2="6" y2="9" />
      </svg>
    ),
    generate: () => generateStar(6),
  },
  {
    id: "weighted",
    name: "Weighted",
    description: "For pathfinding",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
        <circle cx="4" cy="4" r="2" />
        <circle cx="20" cy="4" r="2" />
        <circle cx="4" cy="20" r="2" />
        <circle cx="20" cy="20" r="2" />
        <line x1="6" y1="4" x2="9" y2="4" />
        <line x1="15" y1="4" x2="18" y2="4" />
        <line x1="6" y1="20" x2="9" y2="20" />
        <line x1="15" y1="20" x2="18" y2="20" />
        <line x1="4" y1="6" x2="4" y2="9" />
        <line x1="4" y1="15" x2="4" y2="18" />
        <line x1="20" y1="6" x2="20" y2="9" />
        <line x1="20" y1="15" x2="20" y2="18" />
        <text x="12" y="4" fontSize="5" fill="currentColor" stroke="none" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">3</text>
        <text x="12" y="20" fontSize="5" fill="currentColor" stroke="none" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">7</text>
        <text x="4" y="12.5" fontSize="5" fill="currentColor" stroke="none" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">2</text>
        <text x="20" y="12.5" fontSize="5" fill="currentColor" stroke="none" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">5</text>
      </svg>
    ),
    generate: () => generateWeighted(),
  },
  {
    id: "random-weighted",
    name: "Random Weighted",
    description: "For Dijkstra algorithm",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
        <circle cx="5" cy="5" r="2" />
        <circle cx="19" cy="5" r="2" />
        <circle cx="19" cy="19" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="12" cy="12" r="2" />
        <line x1="6.5" y1="6.5" x2="10.5" y2="10.5" />
        <line x1="17.5" y1="6.5" x2="13.5" y2="10.5" />
        <line x1="17.5" y1="17.5" x2="13.5" y2="13.5" />
        <line x1="6.5" y1="17.5" x2="10.5" y2="13.5" />
        <line x1="7" y1="5" x2="17" y2="5" />
        <text x="12" y="4" fontSize="4.5" fill="currentColor" stroke="none" textAnchor="middle" fontWeight="bold">W</text>
      </svg>
    ),
    generate: () => generateRandomWeightedGraph(6, 1, 15),
  },
];

export const TemplatesTab = ({ onGenerate }: TemplatesTabProps) => {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] uppercase tracking-wider font-semibold text-(--color-text-muted) mb-2 px-0.5">
          Standard Shapes
        </div>
        <div className="grid grid-cols-3 gap-2">
          {templates.map((template) => (
            <CardButton key={template.id} onClick={() => onGenerate(template.generate())}>
              <template.icon className="w-8 h-8 text-(--color-text-muted)" />
              <span className="font-semibold text-[11px] text-(--color-text) text-center leading-tight">
                {template.name}
              </span>
            </CardButton>
          ))}
        </div>
      </div>
    </div>
  );
};
