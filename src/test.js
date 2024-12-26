// Hardcoded variables for now
const stateName = 'Alabama'; // State name
const placeName = 'Birmingham'; // Place name

// Step 1: Get the state FIPS code from the state name
const stateFipsCode = statesFips[stateName];

if (!stateFipsCode) {
  console.error('State FIPS code not found!');
  return;
}

// Step 2: Fetch and process data for the place
const fetchPlaceInfo = async () => {
  try {
    // API URL for fetching all places in the state
    const apiUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=place:*&in=state:${stateFipsCode}&key=8195f92fdf728a3247dc1c`;

    // Fetch place data
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Find the place (e.g., Birmingham)
    const placeData = data.find((item) => item[0].includes(placeName));

    if (!placeData) {
      console.error('Place not found!');
      return;
    }

    // Extract information
    const fullPlaceName = placeData[0]; // Full name of the place
    const placeFipsCode = placeData[2]; // Place FIPS code

    console.log(`Place: ${fullPlaceName}`);
    console.log(`State FIPS: ${stateFipsCode}`);
    console.log(`Place FIPS: ${placeFipsCode}`);

    // Step 3: Fetch additional data (population, income, home value, etc.)
    const detailedApiUrl = `https://api.census.gov/data/2022/acs/acs5?get=B01003_001E,B19013_001E,B25077_001E,B25024_002E&for=place:${placeFipsCode}&in=state:${stateFipsCode}&key=8195f92fdf728a3247dc1c`;
    const detailedResponse = await fetch(detailedApiUrl);
    const detailedData = await detailedResponse.json();

    const [headers, values] = detailedData; // Destructure response into headers and values

    const population = values[0]; // Total population (B01003_001E)
    const medianHouseholdIncome = values[1]; // Median Household Income (B19013_001E)
    const medianHomeValue = values[2]; // Median Home Value (B25077_001E)
    const singleFamilyHomes = values[3]; // Single-Family Homes (B25024_002E)

    console.log(`Population: ${population}`);
    console.log(`Median Household Income: ${medianHouseholdIncome}`);
    console.log(`Median Home Value: ${medianHomeValue}`);
    console.log(`Approx. Single-Family Homes: ${singleFamilyHomes}`);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// Add event listener to fetch data on button click
document
  .querySelector('.submit-selection')
  .addEventListener('click', fetchPlaceInfo);
