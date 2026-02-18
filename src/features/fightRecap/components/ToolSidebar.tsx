import { MousePointer2, Link, Eraser, Circle, Square, Plus } from "lucide-react";
import { Button } from "./ui/Button";

interface ToolSidebarProps {
  onAddEvent: () => void;
}

export function ToolSidebar({ onAddEvent }: ToolSidebarProps) {
  const tools = [
    { icon: MousePointer2, label: "Select", active: true },
    { icon: Link, label: "Link" },
    { icon: Eraser, label: "Eraser" },
    { icon: Circle, label: "Record", color: "text-primary" },
    { icon: Square, label: "Stop" },
  ];

  return (
    <aside className="w-14 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-2">
      {tools.map((tool) => (
        <Button
          key={tool.label}
          variant="ghost"
          size="icon"
          title={tool.label}
          className={`w-10 h-10 ${
            tool.active
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          } ${tool.color || ""}`}
        >
          <tool.icon className="w-5 h-5" />
        </Button>
      ))}

      <div className="flex-1" />

      <Button
        onClick={onAddEvent}
        size="icon"
        title="Add Event"
        className="w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Plus className="w-5 h-5" />
      </Button>
    </aside>
  );
}
