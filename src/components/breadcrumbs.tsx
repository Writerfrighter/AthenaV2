// components/Breadcrumbs.tsx
import Link from "next/link";
import { BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export type BreadcrumbVars = { href: string; label: string };

interface BreadcrumbsProps {
  items: BreadcrumbVars[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex text-sm">
        {items.map((crumb, idx) => (
          <li key={crumb.href} className="flex items-center">
            {idx > 0 && (
              <BreadcrumbSeparator className="mx-2 hidden md:block" />
            )}
            <Link
              href={crumb.href}
              className="text-gray-600 hover:text-gray-900"
            >
              {crumb.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
