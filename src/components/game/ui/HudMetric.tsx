import { cn } from "@/lib/utils";
import { GameIcon } from "./GameIcon";

const HUD_ICON_SIZE = 18;

type HudMetricProps = {
  label: string;
  value: string;
  icon?: string;
  highlight?: boolean;
  className?: string;
};

export function HudMetric({ label, value, icon, highlight, className }: HudMetricProps) {
  return (
    <div className={cn("kepi-hud-tag shrink-0", className)}>
      <div className="kepi-hud-tag-inner">
        <div className={cn("kepi-hud-tag-stack", !icon && "items-center")}>
          <div className="kepi-hud-label-row">
            {icon ? (
              <GameIcon
                src={icon}
                size={HUD_ICON_SIZE}
                className="block shrink-0"
              />
            ) : null}
            <span className="kepi-hud-label">{label}</span>
          </div>
          <span
            className={cn(
              "kepi-hud-value",
              icon && "kepi-hud-value-indented",
              highlight && "kepi-hud-value-highlight font-bold",
            )}
          >
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}
