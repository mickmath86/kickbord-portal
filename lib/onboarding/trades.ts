// Trade list based on Google Local Services Ads categories (reviewed Oct 2026).
// Review quarterly: https://business.google.com/us/ad-solutions/local-service-ads/

export const TRADE_GROUPS: { group: string; trades: string[] }[] = [
  {
    group: 'Home services',
    trades: [
      'Appliance repair', 'Carpenter', 'Carpet cleaning', 'Countertop pro', 'Drain expert', 'Electrician',
      'Fencing pro', 'Flooring pro', 'Foundations pro', 'Garage door', 'General contractor', 'Handyman',
      'Home inspector', 'Home insulation', 'Home security', 'Home theater', 'House cleaning', 'HVAC',
      'Junk removal', 'Landscaper', 'Lawn care', 'Locksmith', 'Moving services', 'Painter', 'Pest control',
      'Plumber', 'Pool cleaning', 'Pool contractor', 'Roofing', 'Sewage system', 'Siding pro', 'Snow removal',
      'Solar energy', 'Tree services', 'Water damage restoration', 'Window cleaning', 'Window repair',
    ],
  },
  {
    group: 'Business services',
    trades: [
      'Bankruptcy lawyer', 'Business lawyer', 'Cellphone and laptop repair', 'Contract lawyer', 'Criminal lawyer',
      'Disability lawyer', 'DUI lawyer', 'Estate lawyer', 'Family lawyer', 'Financial planner', 'Immigration lawyer',
      'IP lawyer', 'Labor lawyer', 'Litigation lawyer', 'Malpractice lawyer', 'Personal injury lawyer',
      'Real estate agent', 'Real estate lawyer', 'Storage', 'Tax lawyer', 'Tax specialist', 'Traffic lawyer',
    ],
  },
  {
    group: 'Health services',
    trades: [
      'Allergist', 'Chiropractor', 'Dentist', 'Dermatologist', 'Dietitian', 'Ophthalmologist', 'Optometrist',
      'Orthodontist', 'Physical therapist', 'Podiatrist', 'Primary care',
    ],
  },
  {
    group: 'Learning services',
    trades: ['Beauty school', 'Dance instructor', 'Driving instructor', 'Language instructor', 'Massage school', 'Preschool', 'Tutor'],
  },
  {
    group: 'Care services',
    trades: [
      'Animal shelter or rescue', 'Child care', 'Funeral home', 'Pet adoption', 'Pet boarding', 'Pet grooming',
      'Pet training', 'Veterinarian',
    ],
  },
  {
    group: 'Wellness services',
    trades: ['Acupuncturist', 'First aid training', 'Personal trainer', 'Weight loss center', 'Yoga studio'],
  },
  { group: 'Beauty services', trades: ['Barber shops', 'Hair removal', 'Hair salon', 'Nail salon', 'Piercing studio'] },
  {
    group: 'Automotive services',
    trades: ['Auto body shop', 'Auto repair shop', 'Car wash and detailing', 'Tire shop', 'Towing'],
  },
]

export const OTHER_TRADE = 'Other (not listed)'

type Preset = { services: string[]; safety?: string }

// Suggestions shown under the services field and used as a starting point for the AI receptionist's
// urgent-situation rules. Keys must match trade labels above.
export const TRADE_PRESETS: Record<string, Preset> = {
  'Garage door': {
    services: ['Spring replacement', 'Opener repair', 'Opener installation', 'New door installation', 'Cable and roller repair', 'Off-track door repair', 'Panel replacement', 'Annual tune-up'],
    safety: 'Door stuck open or closed with a car or person trapped inside, broken spring, or door off its track. Tell the caller not to touch the spring or try to lift the door by hand.',
  },
  HVAC: {
    services: ['AC repair', 'Heating repair', 'System replacement', 'Tune-up and maintenance', 'Duct cleaning', 'Thermostat installation', 'Indoor air quality', 'Mini-split installation'],
    safety: 'Gas smell, carbon monoxide alarm, burning smell, or no heat for elderly, infants, or medical needs. For gas or CO, tell the caller to leave the home and call 911 first.',
  },
  Plumber: {
    services: ['Leak repair', 'Drain cleaning', 'Water heater repair', 'Water heater installation', 'Toilet repair', 'Faucet and fixture installation', 'Repiping', 'Sewer line repair'],
    safety: 'Burst pipe, active flooding, sewage backup, or no water. Tell the caller to shut off the main water valve if they can, and mark the call urgent.',
  },
  Electrician: {
    services: ['Panel upgrade', 'Outlet and switch repair', 'Lighting installation', 'EV charger installation', 'Ceiling fan installation', 'Rewiring', 'Generator installation', 'Troubleshooting'],
    safety: 'Burning smell, sparks, smoke, or a hot panel. Tell the caller to turn off the breaker if safe and call 911 for fire or smoke.',
  },
  Roofing: {
    services: ['Roof repair', 'Roof replacement', 'Leak repair', 'Roof inspection', 'Gutter installation', 'Flashing repair', 'Storm damage repair', 'Tarping'],
    safety: 'Active leak, storm damage, or a tree through the roof. Tell the caller to move belongings away and mark the call urgent.',
  },
  'General contractor': {
    services: ['Kitchen remodel', 'Bathroom remodel', 'Room addition', 'ADU construction', 'Whole-home remodel', 'Deck and patio', 'Flooring', 'Drywall and paint'],
  },
  Handyman: {
    services: ['Small repairs', 'Drywall repair', 'Furniture assembly', 'TV mounting', 'Door and lock repair', 'Painting touch-ups', 'Shelving', 'Caulking and sealing'],
  },
  Landscaper: {
    services: ['Landscape design', 'Hardscape and patios', 'Irrigation', 'Planting', 'Sod installation', 'Retaining walls', 'Lighting', 'Seasonal cleanup'],
  },
  'Lawn care': {
    services: ['Mowing', 'Edging and trimming', 'Fertilizing', 'Weed control', 'Aeration', 'Overseeding', 'Leaf cleanup', 'Hedge trimming'],
  },
  'Pest control': {
    services: ['General pest control', 'Ant control', 'Rodent control', 'Termite treatment', 'Bed bug treatment', 'Mosquito control', 'Wildlife removal', 'Quarterly plans'],
    safety: 'Stinging insects near children or anyone with allergies, or wildlife inside the home. Tell the caller to stay clear and call 911 for an allergic reaction.',
  },
  Painter: {
    services: ['Interior painting', 'Exterior painting', 'Cabinet painting', 'Deck staining', 'Drywall repair', 'Wallpaper', 'Pressure washing', 'Commercial painting'],
  },
  'Flooring pro': {
    services: ['Hardwood installation', 'Tile installation', 'Laminate and vinyl plank', 'Carpet installation', 'Refinishing', 'Floor repair', 'Subfloor repair', 'Estimates'],
  },
  Locksmith: {
    services: ['Lockout service', 'Lock rekey', 'Lock replacement', 'Car key replacement', 'Smart lock installation', 'Safe opening', 'Commercial locks', 'Emergency lockout'],
    safety: 'Child or pet locked in a vehicle or home. Tell the caller to call 911 first.',
  },
  'Tree services': {
    services: ['Tree removal', 'Tree trimming', 'Stump grinding', 'Emergency storm cleanup', 'Tree health assessment', 'Lot clearing', 'Hedge trimming'],
    safety: 'Tree on a house, car, or power line. Tell the caller to stay away from downed lines and call 911 or the utility.',
  },
  'House cleaning': {
    services: ['Standard cleaning', 'Deep cleaning', 'Move-in and move-out cleaning', 'Recurring cleaning', 'Post-construction cleaning', 'Office cleaning'],
  },
  'Junk removal': {
    services: ['Furniture removal', 'Appliance removal', 'Yard waste', 'Construction debris', 'Estate cleanouts', 'Garage cleanouts', 'Hot tub removal'],
  },
  'Appliance repair': {
    services: ['Refrigerator repair', 'Washer and dryer repair', 'Oven and range repair', 'Dishwasher repair', 'Microwave repair', 'Freezer repair', 'Installation'],
    safety: 'Gas smell from an oven or dryer. Tell the caller to leave the home and call 911 or the gas company first.',
  },
  'Water damage restoration': {
    services: ['Water extraction', 'Drying and dehumidification', 'Mold remediation', 'Storm damage', 'Sewage cleanup', 'Fire and smoke damage', 'Insurance claim help'],
    safety: 'Active flooding, sewage, or water near electrical panels. Tell the caller to stay out of standing water near electricity and mark the call urgent.',
  },
}

export function presetFor(trade: unknown): Preset | undefined {
  return typeof trade === 'string' ? TRADE_PRESETS[trade] : undefined
}
