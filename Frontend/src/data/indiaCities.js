// India-wide city list, grouped by state / union territory.
//
// Covers every district headquarters plus the larger towns of each state, so a
// recruiter posting a role in a tier-3 city can find it by typing. Names are the
// current official spellings; well-known former names are kept as aliases in
// CITY_ALIASES below so searching "Bangalore" still surfaces "Bengaluru".

export const indiaStatesAndCities = {
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Rajahmundry",
    "Kakinada", "Kadapa", "Anantapur", "Eluru", "Ongole", "Chittoor", "Machilipatnam", "Srikakulam",
    "Vizianagaram", "Nandyal", "Adoni", "Madanapalle", "Proddatur", "Hindupur", "Bhimavaram",
    "Tadepalligudem", "Narasaraopet", "Tenali", "Chirala", "Dharmavaram", "Gudivada", "Tadpatri",
    "Amaravati", "Mangalagiri", "Tanuku", "Markapur", "Ponnur", "Palakollu", "Sullurpeta",
  ],
  "Arunachal Pradesh": [
    "Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Roing", "Bomdila", "Tezu", "Along",
    "Namsai", "Changlang", "Khonsa", "Daporijo", "Seppa", "Yingkiong",
  ],
  "Assam": [
    "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon",
    "Dhubri", "Diphu", "North Lakhimpur", "Karimganj", "Sivasagar", "Goalpara", "Barpeta",
    "Golaghat", "Hailakandi", "Mangaldoi", "Nalbari", "Rangia", "Haflong", "Kokrajhar", "Dhemaji",
    "Morigaon", "Duliajan", "Digboi", "Margherita", "Lanka",
  ],
  "Bihar": [
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Arrah", "Begusarai",
    "Katihar", "Munger", "Chapra", "Danapur", "Saharsa", "Sasaram", "Hajipur", "Dehri", "Siwan",
    "Motihari", "Nawada", "Bagaha", "Buxar", "Kishanganj", "Sitamarhi", "Jamalpur", "Jehanabad",
    "Aurangabad", "Lakhisarai", "Bettiah", "Madhubani", "Samastipur", "Supaul", "Araria",
    "Bhabua", "Khagaria", "Gopalganj", "Sheikhpura", "Banka", "Madhepura", "Jamui", "Arwal",
  ],
  "Chhattisgarh": [
    "Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Raigarh", "Jagdalpur",
    "Ambikapur", "Dhamtari", "Mahasamund", "Chirmiri", "Janjgir", "Kanker", "Kawardha",
    "Naya Raipur", "Bhatapara", "Dalli Rajhara", "Mungeli", "Sakti", "Baikunthpur", "Dantewada",
  ],
  "Goa": [
    "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim",
    "Cuncolim", "Canacona", "Valpoi", "Porvorim", "Calangute", "Verna",
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh",
    "Gandhidham", "Anand", "Nadiad", "Navsari", "Bharuch", "Morbi", "Mehsana", "Surendranagar",
    "Bhuj", "Porbandar", "Palanpur", "Valsad", "Vapi", "Veraval", "Godhra", "Patan", "Ankleshwar",
    "Botad", "Amreli", "Deesa", "Jetpur", "Dahod", "Himatnagar", "Kalol", "Bardoli", "Sanand",
    "Halol", "Silvassa", "Modasa", "Wankaner", "Upleta", "Mundra", "Dholera",
  ],
  "Haryana": [
    "Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal",
    "Sonipat", "Panchkula", "Bhiwani", "Sirsa", "Bahadurgarh", "Jind", "Thanesar", "Kaithal",
    "Rewari", "Palwal", "Narnaul", "Fatehabad", "Gohana", "Tohana", "Hansi", "Charkhi Dadri",
    "Jhajjar", "Nuh", "Manesar", "Kurukshetra", "Pinjore", "Ballabgarh", "Samalkha",
  ],
  "Himachal Pradesh": [
    "Shimla", "Solan", "Dharamshala", "Mandi", "Kullu", "Manali", "Baddi", "Nahan", "Una",
    "Hamirpur", "Bilaspur", "Chamba", "Kangra", "Palampur", "Paonta Sahib", "Sundernagar",
    "Nalagarh", "Parwanoo", "Keylong", "Reckong Peo", "Kasauli", "Dalhousie",
  ],
  "Jharkhand": [
    "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar", "Hazaribagh", "Giridih",
    "Ramgarh", "Phusro", "Medininagar", "Chirkunda", "Chaibasa", "Dumka", "Gumla", "Sahibganj",
    "Godda", "Chatra", "Lohardaga", "Simdega", "Jhumri Telaiya", "Adityapur", "Khunti", "Pakur",
  ],
  "Karnataka": [
    "Bengaluru", "Mysuru", "Hubballi", "Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", "Ballari",
    "Davanagere", "Vijayapura", "Shivamogga", "Tumakuru", "Raichur", "Bidar", "Hassan", "Udupi",
    "Gadag", "Chitradurga", "Kolar", "Mandya", "Chikkamagaluru", "Bagalkot", "Hospet", "Robertsonpet",
    "Bhadravati", "Ranebennur", "Karwar", "Sirsi", "Puttur", "Yadgir", "Koppal", "Haveri",
    "Chikkaballapur", "Ramanagara", "Madikeri", "Nippani", "Gangavati", "Sindhanur", "Bantwal",
    "Whitefield", "Electronic City", "Devanahalli", "Nelamangala",
  ],
  "Kerala": [
    "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Alappuzha", "Palakkad",
    "Kannur", "Kottayam", "Malappuram", "Pathanamthitta", "Idukki", "Kasaragod", "Wayanad",
    "Ernakulam", "Aluva", "Perinthalmanna", "Manjeri", "Ponnani", "Thalassery", "Payyanur",
    "Kalpetta", "Changanassery", "Cherthala", "Kayamkulam", "Nedumangad", "Neyyattinkara",
    "Tirur", "Guruvayur", "Chalakudy", "Muvattupuzha", "Thodupuzha", "Kunnamkulam", "Infopark",
    "Technopark", "Kakkanad",
  ],
  "Madhya Pradesh": [
    "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam",
    "Rewa", "Katni", "Singrauli", "Burhanpur", "Khandwa", "Morena", "Bhind", "Guna", "Shivpuri",
    "Vidisha", "Chhindwara", "Damoh", "Mandsaur", "Khargone", "Neemuch", "Pithampur", "Hoshangabad",
    "Itarsi", "Sehore", "Betul", "Seoni", "Datia", "Nagda", "Dhar", "Balaghat", "Shahdol",
    "Chhatarpur", "Tikamgarh", "Sarni", "Mhow", "Barwani", "Harda", "Panna", "Narsinghpur",
  ],
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Chhatrapati Sambhajinagar", "Solapur",
    "Navi Mumbai", "Kalyan", "Dombivli", "Vasai", "Virar", "Amravati", "Kolhapur", "Nanded",
    "Sangli", "Jalgaon", "Akola", "Latur", "Dhule", "Ahmednagar", "Chandrapur", "Parbhani",
    "Ichalkaranji", "Jalna", "Bhusawal", "Panvel", "Satara", "Beed", "Yavatmal", "Osmanabad",
    "Nandurbar", "Wardha", "Udgir", "Hinganghat", "Gondia", "Barshi", "Achalpur", "Ratnagiri",
    "Baramati", "Mira Bhayandar", "Ulhasnagar", "Badlapur", "Ambernath", "Bhiwandi", "Pimpri",
    "Chinchwad", "Hinjewadi", "Kharadi", "Powai", "Andheri", "Aurangabad", "Sindhudurg", "Alibaug",
    "Karad", "Malegaon", "Shirdi", "Pen", "Lonavala", "Talegaon", "Chakan", "Wagholi",
  ],
  "Manipur": [
    "Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching", "Ukhrul", "Senapati", "Jiribam",
    "Tamenglong", "Chandel", "Moreh",
  ],
  "Meghalaya": [
    "Shillong", "Tura", "Jowai", "Nongstoin", "Baghmara", "Williamnagar", "Resubelpara",
    "Nongpoh", "Mairang", "Byrnihat",
  ],
  "Mizoram": [
    "Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Saiha", "Lawngtlai", "Mamit",
  ],
  "Nagaland": [
    "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon", "Phek",
    "Chumukedima", "Kiphire", "Longleng", "Peren",
  ],
  "Odisha": [
    "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak",
    "Baripada", "Jharsuguda", "Angul", "Jeypore", "Bargarh", "Rayagada", "Paradip", "Dhenkanal",
    "Kendrapara", "Jajpur", "Koraput", "Sundargarh", "Bolangir", "Nabarangpur", "Phulbani",
    "Talcher", "Keonjhar", "Barbil", "Nayagarh", "Bhawanipatna", "Khordha", "Rajgangpur",
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali", "Bathinda", "Hoshiarpur", "Pathankot",
    "Moga", "Batala", "Firozpur", "Phagwara", "Kapurthala", "Khanna", "Muktsar", "Barnala",
    "Rajpura", "Sangrur", "Fazilka", "Gurdaspur", "Malerkotla", "Nabha", "Zirakpur", "Mansa",
    "Nawanshahr", "Faridkot", "Ropar", "Tarn Taran", "Abohar", "Sunam", "Jagraon", "Dera Bassi",
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Sikar",
    "Bharatpur", "Pali", "Sri Ganganagar", "Kishangarh", "Baran", "Dhaulpur", "Tonk", "Beawar",
    "Hanumangarh", "Gangapur City", "Sawai Madhopur", "Churu", "Jhunjhunu", "Banswara", "Nagaur",
    "Chittorgarh", "Bundi", "Barmer", "Jaisalmer", "Dausa", "Sirohi", "Jhalawar", "Rajsamand",
    "Pratapgarh", "Karauli", "Fatehpur", "Makrana", "Nathdwara", "Neemrana", "Behror", "Mount Abu",
  ],
  "Sikkim": [
    "Gangtok", "Namchi", "Gyalshing", "Mangan", "Rangpo", "Singtam", "Jorethang", "Ravangla",
    "Pelling",
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur",
    "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur",
    "Hosur", "Nagercoil", "Kanchipuram", "Kumbakonam", "Cuddalore", "Tiruvannamalai", "Pollachi",
    "Rajapalayam", "Pudukkottai", "Neyveli", "Namakkal", "Karaikudi", "Virudhunagar", "Dharmapuri",
    "Krishnagiri", "Ariyalur", "Perambalur", "Nagapattinam", "Villupuram", "Theni", "Tenkasi",
    "Ramanathapuram", "Udhagamandalam", "Coonoor", "Mettupalayam", "Avadi", "Tambaram", "Ambattur",
    "Sriperumbudur", "Oragadam", "Chengalpattu", "Mahabalipuram", "Sholinganallur", "Guindy",
    "Gudiyatham", "Arakkonam", "Tindivanam", "Palani", "Sankarankovil", "Aruppukottai",
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Ramagundam", "Khammam", "Mahbubnagar",
    "Nalgonda", "Adilabad", "Suryapet", "Miryalaguda", "Jagtial", "Mancherial", "Siddipet",
    "Kothagudem", "Bhongir", "Sangareddy", "Medak", "Wanaparthy", "Vikarabad", "Nirmal",
    "Kamareddy", "Gadwal", "Zaheerabad", "Bodhan", "Secunderabad", "Gachibowli", "Madhapur",
    "Kondapur", "Shamshabad", "Patancheru",
  ],
  "Tripura": [
    "Agartala", "Udaipur", "Dharmanagar", "Kailashahar", "Belonia", "Ambassa", "Khowai",
    "Teliamura", "Sabroom", "Sonamura", "Bishalgarh",
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Prayagraj", "Noida",
    "Greater Noida", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Firozabad",
    "Jhansi", "Muzaffarnagar", "Mathura", "Rampur", "Shahjahanpur", "Faizabad", "Ayodhya",
    "Farrukhabad", "Hapur", "Etawah", "Mirzapur", "Bulandshahr", "Sambhal", "Amroha", "Hardoi",
    "Fatehpur", "Raebareli", "Orai", "Sitapur", "Bahraich", "Modinagar", "Unnao", "Jaunpur",
    "Lakhimpur", "Hathras", "Banda", "Pilibhit", "Barabanki", "Khurja", "Gonda", "Mainpuri",
    "Lalitpur", "Etah", "Deoria", "Ujhani", "Ghazipur", "Sultanpur", "Azamgarh", "Bijnor",
    "Basti", "Chandausi", "Akbarpur", "Ballia", "Mughalsarai", "Mau", "Kasganj", "Shikohabad",
    "Vrindavan", "Dadri", "Baghpat", "Sikandrabad", "Kannauj", "Chitrakoot", "Kushinagar",
  ],
  "Uttarakhand": [
    "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Kotdwar",
    "Nainital", "Mussoorie", "Almora", "Pithoragarh", "Pauri", "Srinagar", "Ramnagar", "Manglaur",
    "Jaspur", "Bageshwar", "Chamoli", "Tehri", "Uttarkashi", "Champawat", "Sitarganj", "Pantnagar",
    "Selaqui",
  ],
  "West Bengal": [
    "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur",
    "Habra", "Kharagpur", "Shantipur", "Dankuni", "Darjeeling", "Haldia", "Raiganj", "Krishnanagar",
    "Nabadwip", "Medinipur", "Jalpaiguri", "Balurghat", "Basirhat", "Bankura", "Chakdaha",
    "Bangaon", "Cooch Behar", "Purulia", "Alipurduar", "Bolpur", "Barasat", "Barrackpore",
    "Serampore", "Rajarhat", "Salt Lake City", "New Town", "Kalyani", "Uluberia", "Bidhannagar",
    "Ranaghat", "Jangipur", "Tamluk", "Arambagh", "Suri",
  ],
  "Andaman & Nicobar": ["Port Blair", "Car Nicobar", "Mayabunder", "Diglipur", "Rangat"],
  "Chandigarh": ["Chandigarh"],
  "Dadra & Nagar Haveli and Daman & Diu": ["Silvassa", "Daman", "Diu", "Amli"],
  "Delhi": [
    "New Delhi", "Delhi", "Dwarka", "Rohini", "Saket", "Connaught Place", "Okhla", "Janakpuri",
    "Pitampura", "Karol Bagh", "Nehru Place", "Vasant Kunj", "Mayur Vihar", "Shahdara", "Narela",
    "Najafgarh",
  ],
  "Jammu & Kashmir": [
    "Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur", "Kathua", "Sopore", "Rajouri",
    "Poonch", "Kupwara", "Pulwama", "Budgam", "Bandipora", "Doda", "Kishtwar", "Samba", "Katra",
    "Ganderbal", "Reasi", "Ramban", "Shopian", "Kulgam",
  ],
  "Ladakh": ["Leh", "Kargil", "Nubra", "Diskit"],
  "Lakshadweep": ["Kavaratti", "Agatti", "Minicoy", "Andrott"],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam", "Villianur"],
};

// Former / colloquial names people still type. Searching an alias surfaces the
// official city so the saved value stays consistent.
export const CITY_ALIASES = {
  "Bangalore": "Bengaluru",
  "Bombay": "Mumbai",
  "Calcutta": "Kolkata",
  "Madras": "Chennai",
  "Mysore": "Mysuru",
  "Mangalore": "Mangaluru",
  "Belgaum": "Belagavi",
  "Gulbarga": "Kalaburagi",
  "Bellary": "Ballari",
  "Hubli": "Hubballi",
  "Shimoga": "Shivamogga",
  "Tumkur": "Tumakuru",
  "Bijapur": "Vijayapura",
  "Bijnaur": "Bijnor",
  "Trivandrum": "Thiruvananthapuram",
  "Calicut": "Kozhikode",
  "Cochin": "Kochi",
  "Trichur": "Thrissur",
  "Quilon": "Kollam",
  "Trichy": "Tiruchirappalli",
  "Tuticorin": "Thoothukudi",
  "Ooty": "Udhagamandalam",
  "Pondicherry": "Puducherry",
  "Allahabad": "Prayagraj",
  "Gurgaon": "Gurugram",
  "Baroda": "Vadodara",
  "Poona": "Pune",
  "Aurangabad (MH)": "Chhatrapati Sambhajinagar",
  "Panjim": "Panaji",
  "Simla": "Shimla",
  "Cawnpore": "Kanpur",
  "Benares": "Varanasi",
  "Banaras": "Varanasi",
  "Vizag": "Visakhapatnam",
  "Waltair": "Visakhapatnam",
  "Secunderabad (HYD)": "Secunderabad",
  "Orissa": "Bhubaneswar",
  "NCR": "New Delhi",
  "Gandhi Nagar": "Gandhinagar",
  "Faizabad (Ayodhya)": "Ayodhya",
};

// Flat, de-duplicated, sorted list of every city.
export const indiaCities = [
  ...new Set(Object.values(indiaStatesAndCities).flat()),
].sort((a, b) => a.localeCompare(b));

// city -> state, for showing "Pune, Maharashtra" in suggestions.
export const CITY_STATE = (() => {
  const map = {};
  Object.entries(indiaStatesAndCities).forEach(([state, cities]) => {
    cities.forEach(c => { if (!map[c]) map[c] = state; });
  });
  return map;
})();

/**
 * Rank cities against what the user typed. Prefix matches come first, then
 * matches on a later word ("Salt Lake" finds "Salt Lake City"), then anything
 * containing the term; aliases and state names are searchable too.
 *
 * @param {string} query        what the user typed
 * @param {string[]} extraCities custom cities added during this session
 * @param {number} limit        how many suggestions to return
 * @returns {{city: string, state: string, via?: string}[]}
 */
export function searchCities(query, extraCities = [], limit = 12) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const pool = [...new Set([...extraCities, ...indiaCities])];
  const aliasHits = Object.entries(CITY_ALIASES)
    .filter(([alias]) => alias.toLowerCase().startsWith(q))
    .map(([alias, city]) => ({ city, state: CITY_STATE[city] || '', via: alias, rank: 1 }));

  const scored = [];
  for (const city of pool) {
    const lc = city.toLowerCase();
    const state = CITY_STATE[city] || '';
    let rank;
    if (lc.startsWith(q)) rank = 0;
    else if (lc.split(/[\s-]+/).some(w => w.startsWith(q))) rank = 2;
    else if (lc.includes(q)) rank = 3;
    else if (state.toLowerCase().startsWith(q)) rank = 4;
    else continue;
    scored.push({ city, state, rank });
  }

  const seen = new Set();
  return [...aliasHits, ...scored]
    .sort((a, b) => a.rank - b.rank || a.city.localeCompare(b.city))
    .filter(r => (seen.has(r.city) ? false : (seen.add(r.city), true)))
    .slice(0, limit);
}
