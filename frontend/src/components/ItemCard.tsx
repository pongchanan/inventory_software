import { Item, getImageUrl } from "@/lib/api";
import Image from "next/image";
import { CheckCircle, XCircle } from "lucide-react";

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative w-full h-48 bg-gray-100">
        <Image
          src={getImageUrl(item.image_url)}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg text-foreground leading-tight">
            {item.name}
          </h3>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
              item.available
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {item.available ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            {item.available ? "Available" : "Unavailable"}
          </span>
        </div>

        {item.description && (
          <p className="mt-1 text-sm text-muted line-clamp-2">{item.description}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
          {item.category && (
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {item.category}
            </span>
          )}
          {item.location && (
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              📍 {item.location}
            </span>
          )}
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            Qty: {item.quantity}
          </span>
        </div>
      </div>
    </div>
  );
}
