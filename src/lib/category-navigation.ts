
export type CategoryFromApi = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  showInNavigation: boolean;
  displayOrder?: number;
};

export type NavLink = {
  key: string;
  label: string;
  href: string;
};

function normalizeCategoryName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isEligibleCategory(
  value: unknown
): value is CategoryFromApi {
  if (!value || typeof value !== "object") {
    return false;
  }

  const category = value as Partial<CategoryFromApi>;

  return (
    typeof category.id === "string" &&
    category.id.trim().length > 0 &&
    typeof category.name === "string" &&
    category.name.trim().length > 0 &&
    typeof category.slug === "string" &&
    category.slug.trim().length > 0 &&
    category.isActive === true &&
    category.showInNavigation === true
  );
}

export function getCategoryHref(
  category: CategoryFromApi
): string {
  const normalizedName = normalizeCategoryName(category.name);
  const normalizedSlug = normalizeCategoryName(category.slug);

  if (
    normalizedName === "special-editions" ||
    normalizedSlug === "special-editions"
  ) {
    return "/special-editions";
  }

  return `/products?category=${encodeURIComponent(category.slug)}`;
}

export function getEligibleNavigationCategories(
  categories: readonly unknown[]
): CategoryFromApi[] {
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  return categories
    .filter(isEligibleCategory)
    .filter((category) => {
      const normalizedName = normalizeCategoryName(category.name);
      const normalizedSlug = normalizeCategoryName(category.slug);

      // ALL COLLECTIONS remains a separate, static navigation link.
      if (
        normalizedName === "all-collections" ||
        normalizedSlug === "all-collections"
      ) {
        return false;
      }

      if (
        seenIds.has(category.id) ||
        seenSlugs.has(normalizedSlug)
      ) {
        return false;
      }

      seenIds.add(category.id);
      seenSlugs.add(normalizedSlug);

      return true;
    })
    .sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );
}

export function buildCategoryNavigation(
  categories: readonly unknown[]
): NavLink[] {
  return getEligibleNavigationCategories(categories).map(
    (category) => ({
      key: category.id,

      // Always use the current category name returned by Admin/API.
      label: category.name.trim().toUpperCase(),

      // Preserve the special route for Special Editions.
      href: getCategoryHref(category),
    })
  );
}
