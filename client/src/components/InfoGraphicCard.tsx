interface InfoGraphicCardProps {
  title: string;
  content: string;
  imageUrl?: string;
}

export default function InfoGraphicCard({
  title,
  content,
  imageUrl,
}: InfoGraphicCardProps) {
  return (
    <div className="bg-[#F5F5F7] rounded-lg overflow-hidden border border-[#E5E7EB]">
      <div className="p-3">
        <h4 className="font-semibold text-sm text-[#1F2937] mb-1">{title}</h4>
        <p className="text-xs text-[#6B7280]">{content}</p>
      </div>
      {imageUrl && (
        <div className="h-36 bg-gray-200 relative">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
