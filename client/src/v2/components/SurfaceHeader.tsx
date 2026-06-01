import { ventures } from "../mock/data";
import { useRole } from "../context/RoleContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SurfaceHeader({
  title,
  description,
  showVenturePicker = true,
}: {
  title: string;
  description: string;
  showVenturePicker?: boolean;
}) {
  const { ventureId, setVentureId } = useRole();

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {showVenturePicker && (
        <Select value={ventureId} onValueChange={setVentureId}>
          <SelectTrigger className="w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ventures.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
