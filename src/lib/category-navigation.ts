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

function isEligibleCategory(value: unknown): value is CategoryFromApi {
  if (!value || typeof value !== "object") return false;

  const category = value as Partial<CategoryFromApi>;

  return (
    typeof category.id === "string" &&
    category.id.length > 0 &&
    typeof category.name === "string" &&
    category.name.trim().length > 0 &&
    typeof category.slug === "string" &&
    category.slug.trim().length > 0 &&
    category.isActive === true &&
    category.showInNavigation === true
  );
}

export function getCategoryHref(category: CategoryFromApi): string {
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

const BUILT_IN_CATEGORIES = [
  {
    label: "EYEGLASSES",
    aliases: ["eyeglasses", "eye-glasses", "eye glasses"],
  },
  {
    label: "SUNGLASSES",
    aliases: ["sunglasses", "sun-glasses", "sun glasses"],
  },
  {
    label: "CONTACT LENSES",
    aliases: ["contact-lenses", "contact lenses"],
  },
  {
    label: "SPECIAL POWER",
    aliases: ["special-power", "special power"],
  },
  {
    label: "SPECIAL EDITIONS",
    aliases: ["special-editions", "special editions"],
  },
] as const;

const BUILT_IN_NAMES = new Set(
  BUILT_IN_CATEGORIES.flatMap((category) =>
    category.aliases.map(normalizeCategoryName)
  )
);

BUILT_IN_NAMES.add("all-collections");

export function buildCategoryNavigation(
  categories: readonly unknown[]
): NavLink[] {
  const sortedCategories = getEligibleNavigationCategories(categories);

  const matchedBuiltInIds = new Set<string>();

  const builtInLinks = BUILT_IN_CATEGORIES.flatMap((definition) => {
    const matchingCategory = sortedCategories.find((category) => {
      const normalizedName = normalizeCategoryName(category.name);
      const normalizedSlug = normalizeCategoryName(category.slug);

      return definition.aliases.some((alias) => {
        const normalizedAlias = normalizeCategoryName(alias);

        return (
          normalizedName === normalizedAlias ||
          normalizedSlug === normalizedAlias
        );
      });
    });

    if (!matchingCategory) return [];

    matchedBuiltInIds.add(matchingCategory.id);

    return [{
      key: matchingCategory.id,
      label: definition.label,
      href: getCategoryHref(matchingCategory),
    }];
  });

  const customLinks = sortedCategories
    .filter((category) => !matchedBuiltInIds.has(category.id))
    .filter((category) => {
      const normalizedName = normalizeCategoryName(category.name);
      const normalizedSlug = normalizeCategoryName(category.slug);

      return (
        !BUILT_IN_NAMES.has(normalizedName) &&
        !BUILT_IN_NAMES.has(normalizedSlug)
      );
    })
    .map((category) => ({
      key: category.id,
      label: category.name.toUpperCase(),
      href: getCategoryHref(category),
    }));

  return [...builtInLinks, ...customLinks];
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

      if (
        normalizedName === "all-collections" ||
        normalizedSlug === "all-collections"
      ) {
        return false;
      }

      if (seenIds.has(category.id) || seenSlugs.has(normalizedSlug)) {
        return false;
      }

      seenIds.add(category.id);
      seenSlugs.add(normalizedSlug);
      return true;
    })
    .sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );
}
