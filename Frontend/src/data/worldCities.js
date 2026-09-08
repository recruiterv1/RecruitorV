// Major cities outside India, for positions that are not India-based.
//
// The location picker was India-only, so a role in Kuwait or London could only
// be entered by typing it in full and adding it by hand — it was never
// suggested, and every recruiter spelled it their own way.
//
// Weighted towards where Indian recruitment actually places people: the Gulf
// first, then the UK, North America, Europe, APAC and Australia. Country stands
// in for the state label in suggestions ("London, United Kingdom").

export const worldCountriesAndCities = {
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Al Ain'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Mecca', 'Medina', 'Jubail', 'Yanbu'],
  'Qatar': ['Doha', 'Al Wakrah', 'Al Rayyan'],
  'Kuwait': ['Kuwait City', 'Hawalli', 'Al Ahmadi', 'Salmiya', 'Farwaniya'],
  'Oman': ['Muscat', 'Salalah', 'Sohar', 'Nizwa'],
  'Bahrain': ['Manama', 'Riffa', 'Muharraq'],

  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh', 'Liverpool',
    'Bristol', 'Sheffield', 'Newcastle', 'Nottingham', 'Cardiff', 'Belfast', 'Cambridge', 'Oxford', 'Reading'],
  'Ireland': ['Dublin', 'Cork', 'Galway', 'Limerick'],

  'United States': ['New York', 'San Francisco', 'San Jose', 'Seattle', 'Austin', 'Boston', 'Chicago',
    'Dallas', 'Houston', 'Atlanta', 'Los Angeles', 'San Diego', 'Denver', 'Phoenix', 'Charlotte',
    'Washington DC', 'Philadelphia', 'Miami', 'Minneapolis', 'Detroit', 'Raleigh', 'Portland',
    'Pittsburgh', 'Columbus', 'Nashville', 'Jersey City', 'Irving', 'Plano', 'Sunnyvale', 'Bellevue'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Mississauga',
    'Waterloo', 'Winnipeg', 'Halifax'],

  'Germany': ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Stuttgart', 'Cologne', 'Dusseldorf', 'Leipzig'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Eindhoven', 'Utrecht'],
  'France': ['Paris', 'Lyon', 'Toulouse', 'Marseille', 'Nice', 'Lille'],
  'Switzerland': ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Malaga'],
  'Italy': ['Milan', 'Rome', 'Turin', 'Bologna', 'Naples'],
  'Poland': ['Warsaw', 'Krakow', 'Wroclaw', 'Gdansk', 'Poznan'],
  'Sweden': ['Stockholm', 'Gothenburg', 'Malmo'],
  'Denmark': ['Copenhagen', 'Aarhus'],
  'Norway': ['Oslo', 'Bergen'],
  'Finland': ['Helsinki', 'Espoo', 'Tampere'],
  'Belgium': ['Brussels', 'Antwerp', 'Ghent'],
  'Austria': ['Vienna', 'Graz', 'Salzburg'],
  'Portugal': ['Lisbon', 'Porto', 'Braga'],
  'Czech Republic': ['Prague', 'Brno', 'Ostrava'],
  'Romania': ['Bucharest', 'Cluj-Napoca', 'Timisoara', 'Iasi'],
  'Hungary': ['Budapest', 'Debrecen'],

  'Singapore': ['Singapore'],
  'Malaysia': ['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Cyberjaya', 'Ipoh'],
  'Japan': ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Kyoto', 'Fukuoka'],
  'China': ['Shanghai', 'Beijing', 'Shenzhen', 'Guangzhou', 'Hangzhou', 'Chengdu'],
  'Hong Kong': ['Hong Kong'],
  'South Korea': ['Seoul', 'Busan', 'Incheon'],
  'Taiwan': ['Taipei', 'Hsinchu', 'Kaohsiung'],
  'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang'],
  'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket'],
  'Indonesia': ['Jakarta', 'Bandung', 'Surabaya'],
  'Philippines': ['Manila', 'Cebu', 'Makati', 'Taguig', 'Davao'],
  'Sri Lanka': ['Colombo', 'Kandy'],
  'Bangladesh': ['Dhaka', 'Chittagong'],
  'Nepal': ['Kathmandu', 'Pokhara'],

  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Gold Coast', 'Hobart'],
  'New Zealand': ['Auckland', 'Wellington', 'Christchurch'],

  'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
  'Kenya': ['Nairobi', 'Mombasa'],
  'Nigeria': ['Lagos', 'Abuja'],
  'Egypt': ['Cairo', 'Alexandria'],
  'Mauritius': ['Port Louis', 'Ebene'],

  'Israel': ['Tel Aviv', 'Jerusalem', 'Haifa'],
  'Turkey': ['Istanbul', 'Ankara', 'Izmir'],
  'Brazil': ['Sao Paulo', 'Rio de Janeiro', 'Brasilia', 'Campinas'],
  'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey'],
  'Argentina': ['Buenos Aires', 'Cordoba'],
  'Chile': ['Santiago'],
};

// Spellings people actually type, mapped to the entry in the list above.
export const WORLD_CITY_ALIASES = {
  'NYC': 'New York',
  'New York City': 'New York',
  'SF': 'San Francisco',
  'Bay Area': 'San Francisco',
  'Silicon Valley': 'San Jose',
  'DC': 'Washington DC',
  'Washington': 'Washington DC',
  'KL': 'Kuala Lumpur',
  'HCMC': 'Ho Chi Minh City',
  'Saigon': 'Ho Chi Minh City',
  'Peking': 'Beijing',
  'Frankfurt am Main': 'Frankfurt',
  'Munchen': 'Munich',
  'Koln': 'Cologne',
  'Wien': 'Vienna',
  'Praha': 'Prague',
  'Lisboa': 'Lisbon',
  'Genf': 'Geneva',
  'Kuwait': 'Kuwait City',
  'Holland': 'Amsterdam',
  'UAE': 'Dubai',
  'UK': 'London',
};

export const worldCities = [
  ...new Set(Object.values(worldCountriesAndCities).flat()),
].sort((a, b) => a.localeCompare(b));

// city -> country, for the suggestion subtitle.
export const WORLD_CITY_COUNTRY = (() => {
  const map = {};
  Object.entries(worldCountriesAndCities).forEach(([country, cities]) => {
    cities.forEach(c => { if (!map[c]) map[c] = country; });
  });
  return map;
})();
