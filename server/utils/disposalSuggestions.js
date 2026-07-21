// Generic suggestions per category - used as a fallback / base layer
const CATEGORY_SUGGESTIONS = {
  produce: [
    'Compost it — fruit and veg scraps break down quickly and enrich garden soil.',
    'Blend leftover pulp/peels into a natural face or hair mask (great for banana, papaya, avocado, cucumber).',
    'Use as plant fertilizer: bury small pieces near houseplant soil or steep peels in water for a nutrient-rich "tea" to water plants with.',
    'Freeze soft fruit before it fully spoils for future smoothies instead of discarding.',
  ],
  dairy: [
    'Do not compost in a home bin — dairy can attract pests and smells while breaking down. Use a municipal food-waste/green bin if your area accepts dairy.',
    'Spoiled milk or yogurt (not moldy) can still be used as a natural fertilizer for acid-loving plants — dilute 1 part dairy to 4 parts water.',
    'Old buttermilk or yogurt (not moldy) can be used as a hair conditioning mask or a face-brightening pack.',
    'If moldy or foul-smelling, seal in a bag and dispose of in regular trash to avoid attracting pests.',
  ],
  meat_seafood: [
    'Do not compost at home — meat and seafood scraps attract pests and rodents in most home compost setups.',
    'Wrap tightly/seal in a bag before placing in the regular trash to prevent odor and leakage.',
    'Check if your city offers a green bin/food-waste collection service that accepts meat — those facilities can handle it safely.',
    'Never use spoiled meat or seafood on skin, hair, or plants.',
  ],
  bakery: [
    'Compostable — stale or moldy bread and baked goods break down well in a compost bin.',
    'If not moldy but just stale, repurpose into breadcrumbs or croutons instead of discarding (only if still within a day or two of expiry, not actually spoiled).',
    'Avoid feeding stale/moldy bread to pets or wildlife — mold can be toxic to animals.',
  ],
  pantry: [
    'Dry pantry items (grains, flour, cereal) can be composted in small amounts if not infested with pests.',
    'Check for pantry moths/weevils before composting — if infested, seal and discard in trash instead to avoid spreading them.',
    'Unopened, non-expired-looking canned goods nearing date labels can often be donated to a local food bank before they actually expire.',
  ],
  beverage: [
    'Liquids can usually be poured down the drain (except milk-based or oil-based beverages — see dairy category for those).',
    'Rinse and recycle the container (bottle/carton) separately from the liquid.',
    'Flat soda or leftover fruit juice can be used to water acid-loving plants in small diluted amounts.',
  ],
  other: [
    'Check the packaging for specific disposal instructions.',
    'If it is plant-based and not moldy, small amounts can usually be composted.',
    'When in doubt, seal and dispose of in regular household trash.',
  ],
};

// Item-specific extra tips (matched by keyword in the item name)
const ITEM_SPECIFIC_TIPS = [
  { keywords: ['banana'], tip: 'Banana peels are excellent for a hair-shine mask (mash and apply to hair for 15 min) or rubbed directly on skin to soothe minor irritation.' },
  { keywords: ['orange', 'lemon', 'lime', 'citrus'], tip: 'Citrus peels can be dried and ground into a natural exfoliating scrub, or simmered on the stove as a natural air freshener.' },
  { keywords: ['egg'], tip: 'Crushed eggshells are a great calcium-rich additive for garden soil or compost, and can also deter slugs around plants.' },
  { keywords: ['coffee'], tip: 'Used coffee grounds make an excellent exfoliating scrub for skin and are a nitrogen-rich compost/plant fertilizer addition.' },
  { keywords: ['avocado'], tip: 'Mashed overripe avocado makes a nourishing hair or face mask thanks to its natural oils.' },
  { keywords: ['cucumber'], tip: 'Cucumber slices (even slightly soft ones) can be used as a cooling, hydrating skin treatment for eyes/face.' },
  { keywords: ['potato'], tip: 'Grated raw potato is often used as a natural skin-brightening remedy for dark spots or puffy eyes.' },
  { keywords: ['tea'], tip: 'Used tea bags/leaves can be added to compost or used as a mild astringent under the eyes.' },
  { keywords: ['milk'], tip: 'Slightly soured milk (not moldy) can be used as a gentle exfoliant when mixed with a bit of sugar or oats for a skin scrub.' },
  { keywords: ['yogurt', 'curd'], tip: 'Plain yogurt/curd nearing expiry (not moldy) is a classic natural face mask and hair conditioner due to its lactic acid content.' },
];

function normalize(str) {
  return (str || '').toLowerCase();
}

/**
 * Returns a disposal suggestion object for a given item.
 * @param {string} itemName
 * @param {string} category - one of the Item schema category enum values
 */
function getDisposalSuggestions(itemName, category) {
  const cat = CATEGORY_SUGGESTIONS[category] ? category : 'other';
  const baseTips = CATEGORY_SUGGESTIONS[cat];

  const nameLower = normalize(itemName);
  const specificTips = ITEM_SPECIFIC_TIPS.filter((entry) =>
    entry.keywords.some((kw) => nameLower.includes(kw))
  ).map((entry) => entry.tip);

  return {
    category: cat,
    generalTips: baseTips,
    specificTips,
    safetyNote:
      'If the item shows mold, a foul/sour smell beyond normal spoilage, or was recalled for safety reasons, do not use it on skin/hair or in food-adjacent compost — dispose of it in sealed household trash instead.',
  };
}

module.exports = { getDisposalSuggestions, CATEGORY_SUGGESTIONS };
