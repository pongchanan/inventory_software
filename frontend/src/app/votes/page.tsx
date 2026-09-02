import Link from "next/link";
import { Dices, PackagePlus, Vote } from "lucide-react";

const POLLS = [
  {
    href: "/votes/equipment",
    title: "New Equipment",
    description: "Suggest and vote for equipment the lab should purchase.",
    icon: PackagePlus,
  },
  {
    href: "/votes/board-games",
    title: "New Board Games",
    description: "Suggest and vote for board games for shared activities.",
    icon: Dices,
  },
];

export default function VotesPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-blue-600 mb-2">
          <Vote size={20} />
          <span className="text-sm font-semibold">Weekly voting</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Choose a poll</h1>
        <p className="text-sm text-gray-500 mt-1">Open a poll to view choices or cast your vote.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {POLLS.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <Icon size={24} className="text-blue-600 mb-4" />
            <h2 className="font-semibold text-gray-900 group-hover:text-blue-700">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
