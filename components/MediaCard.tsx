import Image from "next/image";
import type { MediaResource } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Play, FileText, BookOpen, File, Image as ImgIcon } from "lucide-react";

const typeIcon: Record<MediaResource["type"], typeof Play> = {
  photo: ImgIcon,
  video: Play,
  document: File,
  presentation: FileText,
  trip_book: BookOpen,
  report: FileText,
};

const typeLabel: Record<MediaResource["type"], string> = {
  photo: "Photo",
  video: "Video",
  document: "Document",
  presentation: "Presentation",
  trip_book: "Trip Book",
  report: "Report",
};

export function MediaCard({ m }: { m: MediaResource }) {
  const Icon = typeIcon[m.type];
  return (
    <div className="group bg-white border border-surface-border rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all">
      <div className="relative aspect-4/3 bg-ink/90 overflow-hidden">
        {m.thumbnailUrl ? (
          <Image
            src={m.thumbnailUrl}
            alt={m.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon size={28} className="text-white/50" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="bg-white/95 text-[10px]">
            <Icon size={10} /> {typeLabel[m.type]}
          </Badge>
        </div>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium text-ink line-clamp-1">{m.title}</div>
        <div className="text-[11px] text-text-muted mt-1">{m.year}</div>
      </div>
    </div>
  );
}
